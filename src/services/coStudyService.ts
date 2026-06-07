import { ID, Query } from "appwrite";
import client, { databases, appwriteConfig } from "../lib/appwrite";

const { 
  databaseId, 
  studyRoomsCollectionId, 
  studyRoomMessagesCollectionId, 
  studyRoomMembersCollectionId 
} = appwriteConfig;

// Types
export interface StudyRoom {
  $id?: string;
  name: string;
  description: string;
  membersCount: number;
  maxMembers: number;
  timerMode: "work" | "break";
  isPrivate: boolean;
  creatorId: string;
  createdAt: string;
}

export interface StudyRoomMessage {
  $id?: string;
  roomId: string;
  senderName: string;
  senderId: string;
  message: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface StudyRoomMember {
  $id?: string;
  roomId: string;
  userId: string;
  userName: string;
  status: string;
  isFocusing: boolean;
  lastActive: string;
}

// Global flag to track if Appwrite database collections exist.
// Switched off dynamically if database calls fail (404/collection not found).
let isAppwriteEnabled = true;

// Custom Local Storage Presets for Sandbox Simulation
const LOCAL_ROOMS_KEY = "study_planner_local_rooms";
const LOCAL_MESSAGES_KEY = "study_planner_local_messages";
const LOCAL_MEMBERS_KEY = "study_planner_local_members";

// Initialize local fallback data if empty
const initLocalData = () => {
  if (!localStorage.getItem(LOCAL_ROOMS_KEY)) {
    localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify([
      { id: "lofi-cafe", name: "☕ Lofi Study Cafe", description: "Grab a warm coffee and focus with background beats.", membersCount: 0, maxMembers: 20, timerMode: "work", isPrivate: false, creatorId: "system", createdAt: new Date().toISOString() },
      { id: "silent-lib", name: "📚 Silent University Library", description: "Absolute quiet study environment. Cam optional.", membersCount: 0, maxMembers: 10, timerMode: "work", isPrivate: false, creatorId: "system", createdAt: new Date().toISOString() },
      { id: "exam-cram", name: "⚡ Midterm Exam Cram Zone", description: "Intense studying for upcoming finals.", membersCount: 0, maxMembers: 15, timerMode: "work", isPrivate: false, creatorId: "system", createdAt: new Date().toISOString() }
    ]));
  }
  if (!localStorage.getItem(LOCAL_MESSAGES_KEY)) {
    localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(LOCAL_MEMBERS_KEY)) {
    localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify([]));
  }
};

class CoStudyService {
  private connectionCheckPromise: Promise<boolean> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      initLocalData();
    }
  }

  // Check if Appwrite collections exist and are accessible (cached promise)
  async checkBackendConnection(): Promise<boolean> {
    if (this.connectionCheckPromise) {
      return this.connectionCheckPromise;
    }

    this.connectionCheckPromise = (async () => {
      if (!isAppwriteEnabled) return false;
      try {
        // Test fetching rooms with a limit of 1
        await databases.listDocuments(databaseId, studyRoomsCollectionId, [Query.limit(1)]);
        isAppwriteEnabled = true;
        
        // Dynamically seed default rooms if they aren't already there
        await this.seedDefaultRooms();
        
        return true;
      } catch (err) {
        console.warn("Appwrite Co-Study collections not found or configuration mismatch. Falling back to local multiplayer sandbox simulator.", err);
        isAppwriteEnabled = false;
        return false;
      }
    })();

    return this.connectionCheckPromise;
  }

  // Seed default rooms in Appwrite if they don't exist
  async seedDefaultRooms(): Promise<void> {
    const defaultRooms = [
      { id: "lofi-cafe", name: "☕ Lofi Study Cafe", description: "Grab a warm coffee and focus with background beats.", maxMembers: 20 },
      { id: "silent-lib", name: "📚 Silent University Library", description: "Absolute quiet study environment. Cam optional.", maxMembers: 10 },
      { id: "exam-cram", name: "⚡ Midterm Exam Cram Zone", description: "Intense studying for upcoming finals.", maxMembers: 15 }
    ];

    for (const room of defaultRooms) {
      try {
        // Check if room document already exists in Appwrite
        await databases.getDocument(databaseId, studyRoomsCollectionId, room.id);
      } catch (err: any) {
        // If not found (404), create it
        if (err.code === 404) {
          try {
            await databases.createDocument(
              databaseId,
              studyRoomsCollectionId,
              room.id,
              {
                name: room.name,
                description: room.description,
                membersCount: 0,
                maxMembers: room.maxMembers,
                timerMode: "work",
                isPrivate: false,
                creatorId: "system",
                createdAt: new Date().toISOString()
              }
            );
            console.log(`Seeded default study room in Appwrite: ${room.id}`);
          } catch (createErr) {
            console.error(`Failed to seed default study room ${room.id} in Appwrite:`, createErr);
          }
        }
      }
    }
  }

  // Fetch a single study room by its ID (used for invite deep-links)
  async getRoomById(roomId: string): Promise<StudyRoom | null> {
    await this.checkBackendConnection();

    if (isAppwriteEnabled && !roomId.startsWith("local-")) {
      try {
        const d = await databases.getDocument(databaseId, studyRoomsCollectionId, roomId);
        return {
          $id: d.$id,
          name: d.name,
          description: d.description,
          membersCount: d.membersCount || 0,
          maxMembers: d.maxMembers || 10,
          timerMode: d.timerMode || "work",
          isPrivate: d.isPrivate || false,
          creatorId: d.creatorId,
          createdAt: d.createdAt
        };
      } catch (err) {
        console.error("Failed to fetch room by ID from Appwrite:", err);
      }
    }

    // Local Storage Fallback
    const localRooms = JSON.parse(localStorage.getItem(LOCAL_ROOMS_KEY) || "[]");
    const found = localRooms.find((r: any) => r.id === roomId || r.$id === roomId);
    return found ? { ...found, $id: found.id || found.$id } : null;
  }

  // ========== ROOMS MANAGEMENT ==========

  async getRooms(currentUserId?: string): Promise<StudyRoom[]> {
    await this.checkBackendConnection();

    if (isAppwriteEnabled) {
      try {
        const response = await databases.listDocuments(databaseId, studyRoomsCollectionId, [
          Query.orderDesc("createdAt"),
          Query.limit(100)
        ]);
        return response.documents
          .map(d => ({
            $id: d.$id,
            name: d.name,
            description: d.description,
            membersCount: d.membersCount || 0,
            maxMembers: d.maxMembers || 10,
            timerMode: d.timerMode || "work",
            isPrivate: d.isPrivate || false,
            creatorId: d.creatorId,
            createdAt: d.createdAt
          }))
          .filter(r => !r.isPrivate || r.creatorId === currentUserId);
      } catch (err) {
        console.error("Failed to fetch rooms from Appwrite:", err);
      }
    }

    // Local Storage Fallback
    const localRooms = localStorage.getItem(LOCAL_ROOMS_KEY);
    const rooms = localRooms ? JSON.parse(localRooms).map((r: any) => ({ ...r, $id: r.id })) : [];
    const localMembers = JSON.parse(localStorage.getItem(LOCAL_MEMBERS_KEY) || "[]");
    return rooms
      .map((r: any) => {
        const actualCount = localMembers.filter((m: any) => m.roomId === r.$id).length;
        return { ...r, membersCount: actualCount };
      })
      .filter((r: any) => !r.isPrivate || r.creatorId === currentUserId);
  }

  async createRoom(room: Omit<StudyRoom, "$id" | "membersCount" | "timerMode">): Promise<StudyRoom> {
    await this.checkBackendConnection();

    const newRoomData = {
      name: room.name,
      description: room.description,
      membersCount: 1,
      maxMembers: room.maxMembers,
      timerMode: "work",
      isPrivate: room.isPrivate,
      creatorId: room.creatorId,
      createdAt: room.createdAt
    };

    if (isAppwriteEnabled) {
      try {
        const doc = await databases.createDocument(
          databaseId,
          studyRoomsCollectionId,
          ID.unique(),
          newRoomData
        );
        return { ...newRoomData, $id: doc.$id };
      } catch (err) {
        console.error("Failed to create room in Appwrite:", err);
        throw err;
      }
    }

    // Local Storage Fallback
    const localRooms = JSON.parse(localStorage.getItem(LOCAL_ROOMS_KEY) || "[]");
    const localId = `local-room-${Date.now()}`;
    const localRoom = { ...newRoomData, id: localId, $id: localId };
    localRooms.unshift(localRoom);
    localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(localRooms));
    
    // Dispatch local change event
    window.dispatchEvent(new CustomEvent("localRoomsUpdated"));
    return localRoom;
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.checkBackendConnection();

    if (isAppwriteEnabled && !roomId.startsWith("local-")) {
      try {
        await databases.deleteDocument(databaseId, studyRoomsCollectionId, roomId);
        return;
      } catch (err) {
        console.error("Failed to delete room in Appwrite:", err);
        throw err;
      }
    }

    // Local Storage Fallback
    let localRooms = JSON.parse(localStorage.getItem(LOCAL_ROOMS_KEY) || "[]");
    localRooms = localRooms.filter((r: any) => r.id !== roomId && r.$id !== roomId);
    localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(localRooms));
    window.dispatchEvent(new CustomEvent("localRoomsUpdated"));
  }

  async updateRoomTimer(roomId: string, data: { timerMode: "work" | "break" }): Promise<void> {
    await this.checkBackendConnection();

    if (isAppwriteEnabled && !roomId.startsWith("local-")) {
      try {
        await databases.updateDocument(databaseId, studyRoomsCollectionId, roomId, data);
        return;
      } catch (err) {
        console.error("Failed to update room timer in Appwrite:", err);
      }
    }

    // Local Storage Fallback
    const localRooms = JSON.parse(localStorage.getItem(LOCAL_ROOMS_KEY) || "[]");
    const updated = localRooms.map((r: any) => 
      (r.id === roomId || r.$id === roomId) ? { ...r, ...data } : r
    );
    localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(`localRoomTimerUpdated:${roomId}`, { detail: data }));
  }

  // ========== PRESENCE & MEMBER MANAGEMENT ==========

  async joinRoom(roomId: string, userId: string, userName: string): Promise<void> {
    await this.checkBackendConnection();

    const memberData = {
      roomId,
      userId,
      userName,
      status: "Focusing: Just joined the room",
      isFocusing: true,
      lastActive: new Date().toISOString()
    };

    if (isAppwriteEnabled && !roomId.startsWith("local-")) {
      try {
        // Query to check if member already registered
        const existing = await databases.listDocuments(databaseId, studyRoomMembersCollectionId, [
          Query.equal("roomId", roomId),
          Query.equal("userId", userId)
        ]);

        if (existing.documents.length > 0) {
          // Update existing presence
          await databases.updateDocument(databaseId, studyRoomMembersCollectionId, existing.documents[0].$id, {
            status: memberData.status,
            isFocusing: memberData.isFocusing,
            lastActive: memberData.lastActive
          });
        } else {
          // Create new presence
          await databases.createDocument(databaseId, studyRoomMembersCollectionId, ID.unique(), memberData);
        }

        // Increment room membersCount
        const roomDoc = await databases.getDocument(databaseId, studyRoomsCollectionId, roomId);
        await databases.updateDocument(databaseId, studyRoomsCollectionId, roomId, {
          membersCount: (roomDoc.membersCount || 0) + 1
        });
        return;
      } catch (err) {
        console.error("Failed to join room in Appwrite:", err);
        throw err;
      }
    }

    // Local Storage Fallback
    const localMembers = JSON.parse(localStorage.getItem(LOCAL_MEMBERS_KEY) || "[]");
    const exists = localMembers.findIndex((m: any) => m.roomId === roomId && m.userId === userId);
    
    if (exists !== -1) {
      localMembers[exists] = { ...localMembers[exists], ...memberData };
    } else {
      localMembers.push(memberData);
    }
    localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(localMembers));

    // Increment local room members count
    const localRooms = JSON.parse(localStorage.getItem(LOCAL_ROOMS_KEY) || "[]");
    const updatedRooms = localRooms.map((r: any) => 
      (r.id === roomId || r.$id === roomId) ? { ...r, membersCount: (r.membersCount || 0) + 1 } : r
    );
    localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(updatedRooms));

    window.dispatchEvent(new CustomEvent(`localMembersUpdated:${roomId}`));
    window.dispatchEvent(new CustomEvent("localRoomsUpdated"));
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    await this.checkBackendConnection();

    if (isAppwriteEnabled && !roomId.startsWith("local-")) {
      try {
        const existing = await databases.listDocuments(databaseId, studyRoomMembersCollectionId, [
          Query.equal("roomId", roomId),
          Query.equal("userId", userId)
        ]);

        if (existing.documents.length > 0) {
          await databases.deleteDocument(databaseId, studyRoomMembersCollectionId, existing.documents[0].$id);
        }

        // Decrement room membersCount
        const roomDoc = await databases.getDocument(databaseId, studyRoomsCollectionId, roomId);
        await databases.updateDocument(databaseId, studyRoomsCollectionId, roomId, {
          membersCount: Math.max(0, (roomDoc.membersCount || 1) - 1)
        });
        return;
      } catch (err) {
        console.error("Failed to leave room in Appwrite:", err);
      }
    }

    // Local Storage Fallback
    let localMembers = JSON.parse(localStorage.getItem(LOCAL_MEMBERS_KEY) || "[]");
    localMembers = localMembers.filter((m: any) => !(m.roomId === roomId && m.userId === userId));
    localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(localMembers));

    // Decrement local room members count
    const localRooms = JSON.parse(localStorage.getItem(LOCAL_ROOMS_KEY) || "[]");
    const updatedRooms = localRooms.map((r: any) => 
      (r.id === roomId || r.$id === roomId) ? { ...r, membersCount: Math.max(0, (r.membersCount || 1) - 1) } : r
    );
    localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(updatedRooms));

    window.dispatchEvent(new CustomEvent(`localMembersUpdated:${roomId}`));
    window.dispatchEvent(new CustomEvent("localRoomsUpdated"));
  }

  async updateMemberStatus(roomId: string, userId: string, status: string, isFocusing: boolean): Promise<void> {
    await this.checkBackendConnection();

    if (isAppwriteEnabled && !roomId.startsWith("local-")) {
      try {
        const existing = await databases.listDocuments(databaseId, studyRoomMembersCollectionId, [
          Query.equal("roomId", roomId),
          Query.equal("userId", userId)
        ]);

        if (existing.documents.length > 0) {
          await databases.updateDocument(databaseId, studyRoomMembersCollectionId, existing.documents[0].$id, {
            status,
            isFocusing,
            lastActive: new Date().toISOString()
          });
        }
        return;
      } catch (err) {
        console.error("Failed to update status in Appwrite:", err);
      }
    }

    // Local Storage Fallback
    const localMembers = JSON.parse(localStorage.getItem(LOCAL_MEMBERS_KEY) || "[]");
    const idx = localMembers.findIndex((m: any) => m.roomId === roomId && m.userId === userId);
    if (idx !== -1) {
      localMembers[idx] = {
        ...localMembers[idx],
        status,
        isFocusing,
        lastActive: new Date().toISOString()
      };
      localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(localMembers));
      window.dispatchEvent(new CustomEvent(`localMembersUpdated:${roomId}`));
    }
  }

  async getRoomMembers(roomId: string): Promise<StudyRoomMember[]> {
    await this.checkBackendConnection();

    if (isAppwriteEnabled && !roomId.startsWith("local-")) {
      try {
        const response = await databases.listDocuments(databaseId, studyRoomMembersCollectionId, [
          Query.equal("roomId", roomId),
          Query.limit(100)
        ]);
        return response.documents.map(d => ({
          $id: d.$id,
          roomId: d.roomId,
          userId: d.userId,
          userName: d.userName,
          status: d.status || "",
          isFocusing: d.isFocusing || false,
          lastActive: d.lastActive
        }));
      } catch (err) {
        console.error("Failed to fetch room members from Appwrite:", err);
      }
    }

    // Local Storage Fallback
    const localMembers = JSON.parse(localStorage.getItem(LOCAL_MEMBERS_KEY) || "[]");
    return localMembers.filter((m: any) => m.roomId === roomId);
  }

  async pulsePresence(roomId: string, userId: string): Promise<void> {
    await this.checkBackendConnection();

    if (isAppwriteEnabled && !roomId.startsWith("local-")) {
      try {
        const existing = await databases.listDocuments(databaseId, studyRoomMembersCollectionId, [
          Query.equal("roomId", roomId),
          Query.equal("userId", userId)
        ]);

        if (existing.documents.length > 0) {
          await databases.updateDocument(databaseId, studyRoomMembersCollectionId, existing.documents[0].$id, {
            lastActive: new Date().toISOString()
          });
        }
        return;
      } catch (err) {
        // Quiet fail on presence heartbeats
      }
    }

    // Local Storage Fallback
    const localMembers = JSON.parse(localStorage.getItem(LOCAL_MEMBERS_KEY) || "[]");
    const idx = localMembers.findIndex((m: any) => m.roomId === roomId && m.userId === userId);
    if (idx !== -1) {
      localMembers[idx].lastActive = new Date().toISOString();
      localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(localMembers));
    }
  }

  async pruneInactiveMembers(roomId: string): Promise<void> {
    await this.checkBackendConnection();
    const thresholdTime = new Date(Date.now() - 40 * 1000); // 40 seconds ago

    if (isAppwriteEnabled && !roomId.startsWith("local-")) {
      try {
        const response = await databases.listDocuments(databaseId, studyRoomMembersCollectionId, [
          Query.equal("roomId", roomId),
          Query.limit(100)
        ]);

        let decremented = 0;
        for (const doc of response.documents) {
          const lastActiveDate = new Date(doc.lastActive);
          if (lastActiveDate < thresholdTime) {
            await databases.deleteDocument(databaseId, studyRoomMembersCollectionId, doc.$id);
            decremented++;
          }
        }

        if (decremented > 0) {
          const roomDoc = await databases.getDocument(databaseId, studyRoomsCollectionId, roomId);
          await databases.updateDocument(databaseId, studyRoomsCollectionId, roomId, {
            membersCount: Math.max(0, (roomDoc.membersCount || 1) - decremented)
          });
        }
        return;
      } catch (err) {
        console.error("Failed to prune inactive members in Appwrite:", err);
      }
    }

    // Local Storage Fallback
    let localMembers = JSON.parse(localStorage.getItem(LOCAL_MEMBERS_KEY) || "[]");
    const prevCount = localMembers.filter((m: any) => m.roomId === roomId).length;
    localMembers = localMembers.filter((m: any) => {
      if (m.roomId === roomId) {
        const lastActiveDate = new Date(m.lastActive);
        return lastActiveDate >= thresholdTime;
      }
      return true;
    });
    localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(localMembers));

    const nextCount = localMembers.filter((m: any) => m.roomId === roomId).length;
    const decremented = prevCount - nextCount;

    if (decremented > 0) {
      const localRooms = JSON.parse(localStorage.getItem(LOCAL_ROOMS_KEY) || "[]");
      const updatedRooms = localRooms.map((r: any) => 
        (r.id === roomId || r.$id === roomId) ? { ...r, membersCount: Math.max(0, (r.membersCount || 0) - decremented) } : r
      );
      localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(updatedRooms));
      window.dispatchEvent(new CustomEvent(`localMembersUpdated:${roomId}`));
      window.dispatchEvent(new CustomEvent("localRoomsUpdated"));
    }
  }

  // ========== MESSAGES / CHAT MANAGEMENT ==========

  async getMessages(roomId: string): Promise<StudyRoomMessage[]> {
    await this.checkBackendConnection();

    if (isAppwriteEnabled && !roomId.startsWith("local-")) {
      try {
        const response = await databases.listDocuments(databaseId, studyRoomMessagesCollectionId, [
          Query.equal("roomId", roomId),
          Query.orderAsc("timestamp"),
          Query.limit(100)
        ]);
        return response.documents.map(d => ({
          $id: d.$id,
          roomId: d.roomId,
          senderName: d.senderName,
          senderId: d.senderId,
          message: d.message,
          timestamp: d.timestamp,
          isSystem: d.isSystem || false
        }));
      } catch (err) {
        console.error("Failed to fetch chat logs from Appwrite:", err);
      }
    }

    // Local Storage Fallback
    const localMsgs = JSON.parse(localStorage.getItem(LOCAL_MESSAGES_KEY) || "[]");
    return localMsgs.filter((m: any) => m.roomId === roomId);
  }

  async sendMessage(roomMsg: Omit<StudyRoomMessage, "$id">): Promise<StudyRoomMessage> {
    await this.checkBackendConnection();

    if (isAppwriteEnabled && !roomMsg.roomId.startsWith("local-")) {
      try {
        const doc = await databases.createDocument(
          databaseId,
          studyRoomMessagesCollectionId,
          ID.unique(),
          roomMsg
        );
        return { ...roomMsg, $id: doc.$id };
      } catch (err) {
        console.error("Failed to send message to Appwrite:", err);
      }
    }

    // Local Storage Fallback
    const localMsgs = JSON.parse(localStorage.getItem(LOCAL_MESSAGES_KEY) || "[]");
    const newMsg = { ...roomMsg, $id: `msg-${Date.now()}` };
    localMsgs.push(newMsg);
    localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(localMsgs));
    
    // Dispatch local message event
    window.dispatchEvent(new CustomEvent(`localMessageCreated:${roomMsg.roomId}`, { detail: newMsg }));
    return newMsg;
  }

  // ========== REAL-TIME WEBSOCKET SUBSCRIPTION CLIENTS ==========

  // Subscribe to new messages
  subscribeToMessages(roomId: string, callback: (msg: StudyRoomMessage) => void): () => void {
    if (isAppwriteEnabled && !roomId.startsWith("local-")) {
      const targetChannel = `databases.${databaseId}.collections.${studyRoomMessagesCollectionId}.documents`;
      return client.subscribe(targetChannel, (response) => {
        if (response.events.some(e => e.includes(".create"))) {
          const payload = response.payload as any;
          if (payload.roomId === roomId) {
            callback({
              $id: payload.$id,
              roomId: payload.roomId,
              senderName: payload.senderName,
              senderId: payload.senderId,
              message: payload.message,
              timestamp: payload.timestamp,
              isSystem: payload.isSystem || false
            });
          }
        }
      });
    }

    // Local Storage custom listener fallback
    const handleLocalMsg = (e: any) => {
      callback(e.detail);
    };
    window.addEventListener(`localMessageCreated:${roomId}`, handleLocalMsg);
    return () => {
      window.removeEventListener(`localMessageCreated:${roomId}`, handleLocalMsg);
    };
  }

  // Subscribe to room presence updates (joins, leaves, status)
  subscribeToMembers(roomId: string, callback: () => void): () => void {
    if (isAppwriteEnabled && !roomId.startsWith("local-")) {
      const targetChannel = `databases.${databaseId}.collections.${studyRoomMembersCollectionId}.documents`;
      return client.subscribe(targetChannel, (response) => {
        const payload = response.payload as any;
        if (payload.roomId === roomId) {
          callback();
        }
      });
    }

    // Local Storage custom listener fallback
    const handleLocalMembers = () => {
      callback();
    };
    window.addEventListener(`localMembersUpdated:${roomId}`, handleLocalMembers);
    return () => {
      window.removeEventListener(`localMembersUpdated:${roomId}`, handleLocalMembers);
    };
  }

  // Subscribe to host room edits (timer changes)
  subscribeToRoomTimer(roomId: string, callback: (timerMode: "work" | "break") => void): () => void {
    if (isAppwriteEnabled && !roomId.startsWith("local-")) {
      const targetChannel = `databases.${databaseId}.collections.${studyRoomsCollectionId}.documents`;
      return client.subscribe(targetChannel, (response) => {
        if (response.events.some(e => e.includes(".update"))) {
          const payload = response.payload as any;
          if (payload.$id === roomId) {
            callback(payload.timerMode);
          }
        }
      });
    }

    // Local Storage custom listener fallback
    const handleLocalTimer = (e: any) => {
      callback(e.detail.timerMode);
    };
    window.addEventListener(`localRoomTimerUpdated:${roomId}`, handleLocalTimer);
    return () => {
      window.removeEventListener(`localRoomTimerUpdated:${roomId}`, handleLocalTimer);
    };
  }

  // Subscribe to all study rooms updates (creates, updates, deletes, member count changes)
  subscribeToRooms(callback: () => void): () => void {
    if (isAppwriteEnabled) {
      const targetChannel = `databases.${databaseId}.collections.${studyRoomsCollectionId}.documents`;
      return client.subscribe(targetChannel, (response) => {
        callback();
      });
    }

    // Local Storage custom listener fallback
    const handleLocalRooms = () => {
      callback();
    };
    window.addEventListener("localRoomsUpdated", handleLocalRooms);
    return () => {
      window.removeEventListener("localRoomsUpdated", handleLocalRooms);
    };
  }
}

const coStudyService = new CoStudyService();
export default coStudyService;
