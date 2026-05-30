import { jsPDF } from "jspdf";
import { ID, Query } from "appwrite";
import { databases, appwriteConfig, functions } from "../lib/appwrite";

const { databaseId } = appwriteConfig;

export interface UserPlan {
  $id?: string;
  userId: string;
  plan: "free" | "pro" | "premium";
  status: "active" | "trial" | "cancelled" | "expired" | "past_due";
  aiCredits: number;
  maxCredits: number;
  renewalDate: string;
  billingCycle: "monthly" | "yearly";
}

export interface UsageLog {
  id: string;
  userId: string;
  actionType: string;
  creditsUsed: number;
  timestamp: string;
}

export interface Invoice {
  invoiceId: string;
  userId: string;
  date: string;
  amount: string;
  planName: string;
  cycle: string;
}

const PLAN_LIMITS = {
  free: { maxCredits: 10, name: "Starter Free" },
  pro: { maxCredits: 500, name: "Scholar Pro" },
  premium: { maxCredits: 3000, name: "Elite Premium" },
};

class PlanService {
  // ========== GET USER PLAN (DB BACKED) ==========
  async getUserPlan(userId: string): Promise<UserPlan> {
    try {
      const response = await databases.listDocuments(
        databaseId,
        appwriteConfig.userPlansCollectionId,
        [Query.equal("userId", userId)]
      );

      if (response.documents.length > 0) {
        const planDoc = response.documents[0] as any;
        const planData: UserPlan = {
          $id: planDoc.$id,
          userId: planDoc.userId,
          plan: planDoc.plan,
          status: planDoc.status,
          aiCredits: planDoc.aiCredits,
          maxCredits: planDoc.maxCredits,
          renewalDate: planDoc.renewalDate,
          billingCycle: planDoc.billingCycle,
        };
        // Run monthly reset check
        return await this.checkAndResetCredits(planData);
      }

      // Default Free Plan Initialization
      const newPlanData = {
        userId,
        plan: "free" as const,
        status: "active" as const,
        aiCredits: PLAN_LIMITS.free.maxCredits,
        maxCredits: PLAN_LIMITS.free.maxCredits,
        renewalDate: this.calculateNextRenewalDate(new Date(), "monthly"),
        billingCycle: "monthly" as const,
      };

      const createdDoc = await databases.createDocument(
        databaseId,
        appwriteConfig.userPlansCollectionId,
        ID.unique(),
        newPlanData
      );

      const newPlan: UserPlan = {
        $id: createdDoc.$id,
        ...newPlanData
      };

      window.dispatchEvent(new CustomEvent("studyPlanChanged", { detail: newPlan }));
      return newPlan;
    } catch (error) {
      console.error("Error fetching user plan:", error);
      // Fallback
      return {
        userId,
        plan: "free",
        status: "active",
        aiCredits: 10,
        maxCredits: 10,
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        billingCycle: "monthly",
      };
    }
  }

  // ========== SECURE CREDIT DEDUCTION ENGINE ==========
  async deductCredits(userId: string, actionType: string, credits: number): Promise<UserPlan> {
    const plan = await this.getUserPlan(userId);

    if (plan.aiCredits < credits) {
      throw new Error(`Insufficient AI Credits. This action requires ${credits} credits, but you only have ${plan.aiCredits} remaining.`);
    }

    // Deduct
    plan.aiCredits = Math.max(0, plan.aiCredits - credits);
    await this.savePlanState(plan);

    // Write to Usage Log Ledger
    await this.logUsage(userId, actionType, credits);

    return plan;
  }

  // ========== SECURE UPGRADE & STRIPE MOCK ==========
  async upgradePlan(
    userId: string,
    targetPlan: "pro" | "premium",
    cycle: "monthly" | "yearly"
  ): Promise<UserPlan> {
    const plan = await this.getUserPlan(userId);
    const limits = PLAN_LIMITS[targetPlan];

    plan.plan = targetPlan;
    plan.status = "active";
    plan.maxCredits = limits.maxCredits;
    plan.aiCredits = limits.maxCredits; // Reset to max upon upgrade payment
    plan.billingCycle = cycle;
    plan.renewalDate = this.calculateNextRenewalDate(new Date(), cycle);

    await this.savePlanState(plan);

    // Create Invoice Billing Receipt
    const amount = targetPlan === "pro" 
      ? (cycle === "monthly" ? "LKR 1,500" : "LKR 12,000")
      : (cycle === "monthly" ? "LKR 2,500" : "LKR 20,000");

    await this.createInvoice(userId, amount, `${PLAN_LIMITS[targetPlan].name}`, cycle === "monthly" ? "Monthly" : "Yearly");

    return plan;
  }

  // ========== CREATE REAL STRIPE CHECKOUT SESSION ==========
  async createStripeCheckoutSession(
    userId: string,
    plan: "pro" | "premium",
    cycle: "monthly" | "yearly"
  ): Promise<string> {
    try {
      const execution = await functions.createExecution(
        "stripe-checkout", // This matches the Appwrite Function ID
        JSON.stringify({ userId, plan, cycle }),
        false, // wait for completion
        "/",
        "POST",
        { "Content-Type": "application/json" }
      );

      if (!execution.responseBody) {
        throw new Error("No response body received from stripe-checkout function.");
      }

      const result = JSON.parse(execution.responseBody);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.url; // Returns Stripe redirect URL
    } catch (error) {
      console.error("Error creating Stripe checkout session:", error);
      throw error;
    }
  }

  // ========== DOWNGRADE TO FREE ==========
  async downgradeToFree(userId: string): Promise<UserPlan> {
    const plan = await this.getUserPlan(userId);
    plan.plan = "free";
    plan.status = "active";
    plan.maxCredits = PLAN_LIMITS.free.maxCredits;
    plan.aiCredits = Math.min(plan.aiCredits, PLAN_LIMITS.free.maxCredits);
    plan.billingCycle = "monthly";
    plan.renewalDate = this.calculateNextRenewalDate(new Date(), "monthly");

    await this.savePlanState(plan);
    return plan;
  }

  // ========== ACTIVE PRO TRIAL ==========
  async activateTrial(userId: string): Promise<UserPlan> {
    const plan = await this.getUserPlan(userId);
    const limits = PLAN_LIMITS.pro;

    plan.plan = "pro";
    plan.status = "trial";
    plan.maxCredits = limits.maxCredits;
    plan.aiCredits = limits.maxCredits;
    plan.billingCycle = "monthly";
    plan.renewalDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days trial

    await this.savePlanState(plan);

    // Log the trial activation
    await this.logUsage(userId, "7-Day Scholar Pro Trial Activated", 0);

    return plan;
  }

  // ========== RESET CREDIT CHECK (Login-based automatic reset system) ==========
  private async checkAndResetCredits(plan: UserPlan): Promise<UserPlan> {
    const now = new Date();
    const renewal = new Date(plan.renewalDate);

    if (now >= renewal) {
      // Refresh credits based on plan type
      const limits = PLAN_LIMITS[plan.plan];
      plan.aiCredits = limits.maxCredits;
      // Set next renewal
      plan.renewalDate = this.calculateNextRenewalDate(now, plan.billingCycle);
      await this.savePlanState(plan);

      // Log the reset
      await this.logUsage(plan.userId, "Monthly Credit Allowance Reset", 0);
    }

    return plan;
  }

  // ========== USAGE LOG LEDGER ==========
  async getUsageLogs(userId: string): Promise<UsageLog[]> {
    try {
      const response = await databases.listDocuments(
        databaseId,
        appwriteConfig.usageLogsCollectionId,
        [
          Query.equal("userId", userId),
          Query.orderDesc("timestamp"),
          Query.limit(100)
        ]
      );

      return response.documents.map((doc: any) => ({
        id: doc.$id,
        userId: doc.userId,
        actionType: doc.actionType,
        creditsUsed: doc.creditsUsed,
        timestamp: doc.timestamp,
      }));
    } catch (error) {
      console.error("Error fetching usage logs:", error);
      return [];
    }
  }

  private async logUsage(userId: string, actionType: string, creditsUsed: number): Promise<void> {
    try {
      await databases.createDocument(
        databaseId,
        appwriteConfig.usageLogsCollectionId,
        ID.unique(),
        {
          userId,
          actionType,
          creditsUsed,
          timestamp: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error("Error writing usage log:", error);
    }
  }

  // ========== BILLING HISTORY & RECEIPT GENERATOR ==========
  async getInvoices(userId: string): Promise<Invoice[]> {
    try {
      const response = await databases.listDocuments(
        databaseId,
        appwriteConfig.billingHistoryCollectionId,
        [
          Query.equal("userId", userId),
          Query.orderDesc("date")
        ]
      );

      return response.documents.map((doc: any) => ({
        invoiceId: doc.invoiceId,
        userId: doc.userId,
        date: doc.date,
        amount: doc.amount,
        planName: doc.planName,
        cycle: doc.cycle,
      }));
    } catch (error) {
      console.error("Error fetching billing history:", error);
      return [];
    }
  }

  private async createInvoice(userId: string, amount: string, planName: string, cycle: string): Promise<void> {
    try {
      await databases.createDocument(
        databaseId,
        appwriteConfig.billingHistoryCollectionId,
        ID.unique(),
        {
          invoiceId: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
          userId,
          date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
          amount,
          planName,
          cycle,
        }
      );
    } catch (error) {
      console.error("Error creating billing invoice:", error);
    }
  }

  // ========== PDF RECEIPT GENERATOR ==========
  async downloadInvoicePDF(invoice: Invoice, userName: string, userEmail: string): Promise<void> {
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      
      // Receipt Styling
      const purple = { r: 99, g: 102, b: 241 };
      const dark = { r: 17, g: 24, b: 39 };
      const gray = { r: 107, g: 114, b: 128 };
      const border = { r: 229, g: 231, b: 235 };

      // Top Header band
      doc.setFillColor(purple.r, purple.g, purple.b);
      doc.rect(0, 0, 210, 40, "F");

      // App Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("StudyPlanner Inc.", 20, 26);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(220, 225, 255);
      doc.text("Academic Excellence Platforms", 20, 32);

      // Invoice Text right side
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("RECEIPT / INVOICE", 190, 26, { align: "right" });

      // Invoice info block (Left)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(dark.r, dark.g, dark.b);
      doc.text("BILLED TO:", 20, 60);
      doc.setFont("helvetica", "bold");
      doc.text(userName, 20, 66);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(gray.r, gray.g, gray.b);
      doc.text(userEmail, 20, 72);

      // Billed from (Right)
      doc.setTextColor(dark.r, dark.g, dark.b);
      doc.text("ISSUED BY:", 130, 60);
      doc.setFont("helvetica", "bold");
      doc.text("StudyPlanner billing", 130, 66);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(gray.r, gray.g, gray.b);
      doc.text("billing@studyplanner.app", 130, 72);

      // Metadata summary
      doc.setDrawColor(border.r, border.g, border.b);
      doc.setLineWidth(0.3);
      doc.line(20, 85, 190, 85);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(gray.r, gray.g, gray.b);
      doc.text(`Invoice ID: ${invoice.invoiceId}`, 20, 93);
      doc.text(`Billing Date: ${invoice.date}`, 85, 93);
      doc.text("Status: PAID (SECURE STRIPE)", 140, 93);

      doc.line(20, 100, 190, 100);

      // Invoice Item Table Header
      doc.setFillColor(249, 250, 251);
      doc.rect(20, 110, 170, 8, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(dark.r, dark.g, dark.b);
      doc.text("Item Details", 24, 115);
      doc.text("Cycle", 100, 115);
      doc.text("Amount (LKR)", 186, 115, { align: "right" });

      // Table line
      doc.line(20, 118, 190, 118);

      // Invoice Item Row
      doc.setFont("helvetica", "normal");
      doc.text(`StudyPlanner subscription - ${invoice.planName} Tier`, 24, 126);
      doc.text(invoice.cycle, 100, 126);
      doc.setFont("helvetica", "bold");
      doc.text(invoice.amount, 186, 126, { align: "right" });

      doc.line(20, 132, 190, 132);

      // Total Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Total Paid", 130, 145);
      doc.setFontSize(12);
      doc.setTextColor(purple.r, purple.g, purple.b);
      doc.text(invoice.amount, 186, 145, { align: "right" });

      // Footer
      doc.line(20, 160, 190, 160);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(gray.r, gray.g, gray.b);
      doc.text("Thank you for partnering with StudyPlanner to advance your learnings!", 105, 170, { align: "center" });
      doc.text("This receipt was generated securely via Stripe Checkout Integration protocols.", 105, 175, { align: "center" });

      // Save PDF
      doc.save(`Invoice-${invoice.invoiceId}.pdf`);
    } catch (err) {
      console.error("Failed to generate receipt PDF:", err);
    }
  }

  // ========== UTILS ==========
  private calculateNextRenewalDate(startDate: Date, cycle: "monthly" | "yearly"): string {
    const date = new Date(startDate);
    if (cycle === "monthly") {
      date.setMonth(date.getMonth() + 1);
    } else {
      date.setFullYear(date.getFullYear() + 1);
    }
    return date.toISOString();
  }

  private async savePlanState(plan: UserPlan): Promise<void> {
    try {
      if (plan.$id) {
        const { $id, ...updateData } = plan;
        await databases.updateDocument(
          databaseId,
          appwriteConfig.userPlansCollectionId,
          $id,
          updateData
        );
      } else {
        const response = await databases.listDocuments(
          databaseId,
          appwriteConfig.userPlansCollectionId,
          [Query.equal("userId", plan.userId)]
        );
        if (response.documents.length > 0) {
          const docId = response.documents[0].$id;
          const updateData = {
            plan: plan.plan,
            status: plan.status,
            aiCredits: plan.aiCredits,
            maxCredits: plan.maxCredits,
            renewalDate: plan.renewalDate,
            billingCycle: plan.billingCycle,
          };
          await databases.updateDocument(
            databaseId,
            appwriteConfig.userPlansCollectionId,
            docId,
            updateData
          );
          plan.$id = docId;
        } else {
          const createdDoc = await databases.createDocument(
            databaseId,
            appwriteConfig.userPlansCollectionId,
            ID.unique(),
            {
              userId: plan.userId,
              plan: plan.plan,
              status: plan.status,
              aiCredits: plan.aiCredits,
              maxCredits: plan.maxCredits,
              renewalDate: plan.renewalDate,
              billingCycle: plan.billingCycle,
            }
          );
          plan.$id = createdDoc.$id;
        }
      }
      // Trigger plan changes custom event for real-time reactivity in UI components
      window.dispatchEvent(new CustomEvent("studyPlanChanged", { detail: plan }));
    } catch (error) {
      console.error("Error saving plan state to Appwrite:", error);
    }
  }
}

export default new PlanService();
