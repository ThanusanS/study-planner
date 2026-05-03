# Deployment Guide

This guide covers deploying the Study Planner application to production.

## Prerequisites

- Appwrite account (Cloud or Self-hosted)
- Vercel account (or alternative hosting)
- Domain name (optional)

## Part 1: Backend Setup (Appwrite)

### Option A: Appwrite Cloud (Recommended for 100K users)

1. **Sign up at [Appwrite Cloud](https://cloud.appwrite.io)**
   - Choose appropriate plan based on usage
   - Pro plan recommended for 100K+ users

2. **Create Project**
   ```
   Project Name: Study Planner Production
   Region: Choose closest to your users
   ```

3. **Set up Database**
   - Follow [APPWRITE_SETUP.md](./APPWRITE_SETUP.md)
   - Create all collections
   - Set up indexes
   - Configure permissions

4. **Configure Authentication**
   ```
   - Enable Email/Password
   - Set session length: 30 days
   - Enable account verification (optional)
   ```

5. **Add Platform**
   ```
   Platform Type: Web
   Name: Study Planner Web
   Hostname: your-domain.com
   ```

6. **Deploy Functions** (Optional)
   - See [APPWRITE_FUNCTIONS.md](./APPWRITE_FUNCTIONS.md)
   - Deploy task reminders function
   - Deploy exam alerts function
   - Deploy progress logger function

### Option B: Self-hosted Appwrite

1. **Install Docker**
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```

2. **Install Appwrite**
   ```bash
   docker run -it --rm \
     --volume /var/run/docker.sock:/var/run/docker.sock \
     --volume "$(pwd)"/appwrite:/usr/src/code/appwrite:rw \
     --entrypoint="install" \
     appwrite/appwrite:1.4.13
   ```

3. **Configure**
   - Set up DNS
   - Configure SSL certificates
   - Set environment variables
   - Follow setup wizard

4. **Create Database**
   - Same as Cloud setup
   - Follow [APPWRITE_SETUP.md](./APPWRITE_SETUP.md)

## Part 2: Frontend Deployment (Vercel)

### Prerequisites

```bash
# Ensure code is committed to Git
git init
git add .
git commit -m "Initial commit"
git branch -M main

# Push to GitHub
git remote add origin https://github.com/yourusername/study-planner.git
git push -u origin main
```

### Deploy to Vercel

1. **Sign up at [Vercel](https://vercel.com)**

2. **Import Project**
   - Click "Add New" → "Project"
   - Import from GitHub
   - Select your repository

3. **Configure Build Settings**
   ```
   Framework Preset: Vite
   Build Command: pnpm build
   Output Directory: dist
   Install Command: pnpm install
   ```

4. **Environment Variables** (Optional)
   If using environment variables instead of hardcoding:
   ```
   VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID=your_project_id
   VITE_APPWRITE_DATABASE_ID=your_database_id
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Visit your deployment URL

### Custom Domain Setup

1. **Add Domain in Vercel**
   - Go to Project Settings → Domains
   - Add your domain
   - Follow DNS configuration instructions

2. **Update Appwrite Platform**
   - Add your custom domain to Appwrite platforms
   - Update CORS settings

## Part 3: Production Configuration

### Update Appwrite Config

Edit `src/lib/appwrite.ts`:

```typescript
export const appwriteConfig = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || 'your_production_project_id',
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'your_production_database_id',
  subjectsCollectionId: 'subjects',
  topicsCollectionId: 'topics',
  tasksCollectionId: 'tasks',
  examsCollectionId: 'exams',
  progressLogsCollectionId: 'progressLogs',
  pomodoroSessionsCollectionId: 'pomodoroSessions',
};
```

### Security Headers

Add `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

## Part 4: Performance Optimization

### Enable Vercel Edge Network

Automatically enabled - your app will be served from CDN.

### Image Optimization

If using images:
```typescript
// Use Vercel Image Optimization
import Image from 'next/image'
```

### Analytics

Add Vercel Analytics:
```bash
pnpm add @vercel/analytics
```

```typescript
// In App.tsx
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

## Part 5: Monitoring & Logging

### Vercel Monitoring

1. **Enable Analytics**
   - Automatic page views
   - Performance metrics
   - User insights

2. **Error Tracking**
   - Set up Sentry or similar
   - Monitor runtime errors
   - Track user issues

### Appwrite Monitoring

1. **Function Logs**
   - Monitor function executions
   - Track error rates
   - Optimize performance

2. **Database Metrics**
   - Query performance
   - Index usage
   - Storage usage

## Part 6: Scaling Strategy

### For 100,000 Monthly Users

#### Appwrite Cloud Scaling

1. **Choose Right Plan**
   - Pro Plan: Up to 1M users
   - Scale Plan: Custom limits
   - Monitor usage regularly

2. **Database Optimization**
   ```
   ✓ All indexes created
   ✓ Pagination implemented (limit: 100)
   ✓ Efficient queries with filters
   ✓ Regular cleanup of old data
   ```

3. **Function Optimization**
   ```
   ✓ Batch processing
   ✓ Efficient algorithms
   ✓ Proper error handling
   ✓ Timeout management
   ```

#### Frontend Scaling

1. **Vercel Automatic Scaling**
   - Automatically handles traffic spikes
   - Edge network distribution
   - No manual scaling needed

2. **Code Optimization**
   ```typescript
   // Lazy load pages
   const Dashboard = lazy(() => import('./components/Dashboard'));
   
   // Memoize expensive components
   const MemoizedComponent = React.memo(Component);
   
   // Use virtual scrolling for long lists
   import { FixedSizeList } from 'react-window';
   ```

## Part 7: CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install pnpm
        run: npm install -g pnpm
        
      - name: Install dependencies
        run: pnpm install
        
      - name: Build
        run: pnpm build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## Part 8: Post-Deployment Checklist

### Testing

- [ ] User registration works
- [ ] Login/logout functionality
- [ ] All CRUD operations
- [ ] Notifications work
- [ ] Pomodoro timer functions
- [ ] Mobile responsiveness
- [ ] Dark mode toggle
- [ ] Cross-browser compatibility

### Performance

- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] No console errors
- [ ] All images optimized

### Security

- [ ] HTTPS enabled
- [ ] Security headers set
- [ ] API keys not exposed
- [ ] CORS configured correctly
- [ ] Input validation working

### Monitoring

- [ ] Analytics enabled
- [ ] Error tracking set up
- [ ] Uptime monitoring
- [ ] Performance monitoring
- [ ] User feedback mechanism

## Part 9: Backup Strategy

### Database Backups

1. **Appwrite Cloud**
   - Automatic daily backups
   - 7-day retention
   - Manual export available

2. **Manual Backup**
   ```bash
   # Export collections
   appwrite databases listCollections --databaseId=[DATABASE_ID]
   appwrite databases getCollection --databaseId=[DATABASE_ID] --collectionId=[COLLECTION_ID]
   ```

### Code Backups

- GitHub repository (primary)
- Local backups
- Version tags for releases

## Part 10: Maintenance

### Regular Tasks

**Daily**
- Monitor error logs
- Check uptime
- Review user feedback

**Weekly**
- Review analytics
- Check performance metrics
- Update dependencies if needed

**Monthly**
- Database cleanup
- Performance audit
- Security updates
- Cost review

### Update Strategy

```bash
# Update dependencies
pnpm update

# Test locally
pnpm dev

# Build and test
pnpm build

# Deploy to staging first
vercel --prod

# Deploy to production
git push origin main
```

## Troubleshooting

### Build Fails

1. Check Node.js version (18+)
2. Clear cache: `pnpm store prune`
3. Check dependencies
4. Review build logs

### Runtime Errors

1. Check browser console
2. Review Vercel logs
3. Check Appwrite logs
4. Verify environment variables

### Performance Issues

1. Run Lighthouse audit
2. Check bundle size
3. Optimize images
4. Review database queries

## Support & Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Appwrite Documentation](https://appwrite.io/docs)
- [GitHub Issues](https://github.com/yourusername/study-planner/issues)

## Cost Estimation

### For 100,000 Monthly Active Users

**Appwrite Cloud Pro Plan**
- $15/month base
- Additional costs for:
  - Storage: ~$0.10/GB
  - Bandwidth: ~$0.10/GB
  - Functions: ~$0.40/GB-second

**Estimated**: $50-150/month

**Vercel Pro Plan**
- $20/month per member
- Unlimited bandwidth
- Automatic scaling

**Total Estimated Cost**: $70-170/month

---

**Deployment Complete!** 🎉

Your Study Planner is now live and ready to serve 100,000+ students worldwide.
