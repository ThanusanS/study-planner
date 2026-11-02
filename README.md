# Study Planner for Students

A modern, production-ready study planner web application built with React, Tailwind CSS, and Appwrite backend. Designed to handle 100,000+ monthly users with a clean, intuitive UI/UX.

## Features

### Core Features

1. **Daily Task Planner**
   - Create, edit, and delete study tasks
   - One-click task completion toggle
   - Real-time UI updates
   - Filter by status and subject
   - Grouped by due date

2. **Subject & Topic Manager**
   - Create subjects with color coding
   - Add topics under each subject
   - Visual organization system
   - Easy navigation and management

3. **Exam Countdown System**
   - Track upcoming examinations
   - Visual countdown timer
   - Urgent exam highlighting (≤3 days)
   - Dashboard priority section

4. **Progress Tracking Dashboard**
   - Overall task completion rate
   - Daily, weekly, and monthly statistics
   - Study streak tracking
   - Visual progress indicators

5. **Pomodoro Timer with History**
   - 25-minute focus / 5-minute break cycles
   - Track sessions by subject
   - Complete session history
   - Daily/weekly/monthly statistics
   - Browser notifications

6. **Smart Reminder System**
   - Browser notifications for tasks
   - Optional reminder times
   - Permission-based system

### Additional Features

- **Dark Mode**: Full dark mode support
- **Responsive Design**: Mobile-first, works on all devices
- **Real-time Updates**: Instant UI feedback
- **Secure Authentication**: Email/password authentication via Appwrite
- **Data Isolation**: Each user sees only their data

## Tech Stack

### Frontend

- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **next-themes** - Dark mode support
- **date-fns** - Date manipulation
- **sonner** - Toast notifications
- **lucide-react** - Icons

### Backend

- **Appwrite** - Backend as a Service
  - Authentication
  - Database
  - Functions
  - Real-time subscriptions

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Appwrite account (Cloud or Self-hosted)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd study-planner
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up Appwrite**
   - Copy `.env.example` to `.env`
   - Set `APPWRITE_PROJECT_ID` and `APPWRITE_API_KEY`
   - Run `pnpm appwrite:setup` to create the database and all collections
   - Set the `VITE_APPWRITE_*` values for the browser
   - Follow the [Appwrite Setup Guide](./APPWRITE_SETUP.md) for details

4. **Configure environment**
   - Keep browser-safe Appwrite values in `.env`:

   ```bash
   VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID=YOUR_PROJECT_ID
   VITE_APPWRITE_DATABASE_ID=studyplan
   ```

5. **Run the development server**

   ```bash
   pnpm dev
   ```

6. **Open your browser**
   - Navigate to `http://localhost:5173`

## Project Structure

```
study-planner/
├── src/
│   ├── app/
│   │   ├── App.tsx                 # Application shell and routing
│   │   └── components/
│   │       ├── figma/              # Image fallback components
│   │       └── ui/                 # Reusable shadcn/ui components
│   ├── components/                 # Feature and page components
│   │   ├── Ai*.tsx                 # AI document, notes, quiz, roadmap, and tutor tools
│   │   ├── Auth.tsx                # Authentication
│   │   ├── Billing.tsx             # Subscription and billing
│   │   ├── CoStudyRooms.tsx        # Collaborative study rooms
│   │   ├── Dashboard.tsx           # Main dashboard
│   │   ├── ExamsManager.tsx        # Exam tracking
│   │   ├── PomodoroTimer.tsx       # Focus timer
│   │   ├── SubjectsManager.tsx     # Subject management
│   │   └── TasksManager.tsx        # Task management
│   ├── contexts/                   # React context providers
│   ├── imports/                    # Imported image assets
│   ├── lib/appwrite.ts             # Appwrite configuration
│   ├── main.tsx                    # Application entry point
│   ├── services/                   # Appwrite and feature service modules
│   ├── styles/                     # Global styles, themes, and animations
│   └── utils/                      # Shared utility helpers
├── appwrite-functions/             # Serverless Appwrite functions
│   ├── exam-alerts/
│   ├── stripe-checkout/
│   ├── stripe-webhook/
│   └── task-reminders/
├── public/                         # Static assets and web metadata
├── scripts/                        # Appwrite setup and maintenance scripts
├── APPWRITE_SETUP.md               # Appwrite setup guide
├── APPWRITE_FUNCTIONS.md           # Appwrite functions documentation
├── DEPLOYMENT.md                   # Deployment instructions
├── QUICKSTART.md                   # Quick start guide
├── package.json                    # Project scripts and dependencies
├── pnpm-workspace.yaml             # pnpm workspace configuration
├── vite.config.ts                 # Vite configuration
└── README.md                       # This file
```

## Database Schema

### Collections

1. **Subjects** - Study subjects with color coding
2. **Topics** - Topics under each subject
3. **Tasks** - Daily study tasks
4. **Exams** - Upcoming examinations
5. **ProgressLogs** - Daily progress tracking
6. **PomodoroSessions** - Focus session history
7. **QuizHistory** - Saved AI quizzes for retake, edit, and delete

See [Appwrite Setup Guide](./APPWRITE_SETUP.md) for detailed schema.

## Key Features Implementation

### Authentication

- Email/password authentication via Appwrite
- Session-based login
- Protected routes
- User data isolation

### Real-time Updates

- Optimistic UI updates
- Instant feedback on actions
- No page reloads required

### Performance Optimization

- Pagination for all queries (limit: 100)
- Indexed database queries
- Lazy loading
- React component memoization
- Efficient state management

### Scalability (100K+ Users)

- Optimized Appwrite queries
- Proper database indexing
- Frontend caching
- Minimal API calls
- Efficient data structures

## Development

### Adding New Features

1. Create component in `src/components/`
2. Add database service methods if needed
3. Update navigation in `App.tsx`
4. Test thoroughly

### Code Style

- Use TypeScript for type safety
- Follow React best practices
- Use Tailwind CSS for styling
- Keep components modular and reusable

## Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project to Vercel
3. Configure build settings:
   - Build Command: `pnpm build`
   - Output Directory: `dist`
4. Add environment variables if needed
5. Deploy

### Backend (Appwrite)

- **Appwrite Cloud**: Already deployed, just configure
- **Self-hosted**: Follow [Appwrite installation guide](https://appwrite.io/docs/installation)

## Environment Variables

No environment variables needed for development. All configuration is in `src/lib/appwrite.ts`.

For production, consider using environment variables:

```typescript
export const appwriteConfig = {
  endpoint:
    import.meta.env.VITE_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1",
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
  // ...
};
```

## Security

- Input validation on all forms
- Secure permissions per user in Appwrite
- No API keys exposed on frontend
- HTTPS in production
- Content Security Policy headers

## Performance

- **Lighthouse Score**: Aim for 90+ on all metrics
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Bundle Size**: Optimized with code splitting

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notifications

The app uses browser notifications for:

- Task reminders
- Pomodoro timer completion
- Exam alerts

Users must grant notification permission.

## Troubleshooting

### Common Issues

1. **App won't load**
   - Check Appwrite endpoint and project ID
   - Verify internet connection
   - Check browser console for errors

2. **Authentication fails**
   - Verify email/password auth is enabled in Appwrite
   - Check project permissions
   - Clear browser cache

3. **Data not loading**
   - Verify database and collection IDs
   - Check collection permissions
   - Ensure indexes are created

See [Appwrite Setup Guide](./APPWRITE_SETUP.md) for more troubleshooting.

## Future Enhancements

- [ ] PWA support (installable app)
- [ ] Offline mode with local storage sync
- [ ] Advanced analytics dashboard
- [ ] Gamification (badges, achievements)
- [ ] Calendar integration
- [ ] Study group collaboration
- [ ] AI-powered study recommendations
- [ ] Mobile app (React Native)
- [ ] Export data to PDF/CSV
- [ ] Email digest notifications

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Support

For issues and questions:

- Create an issue on GitHub
- Check [Appwrite Documentation](https://appwrite.io/docs)
- Join [Appwrite Discord](https://discord.com/invite/appwrite)

## Acknowledgments

- [Appwrite](https://appwrite.io) - Backend platform
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Tailwind CSS](https://tailwindcss.com) - Styling framework
- [Lucide Icons](https://lucide.dev) - Icon library

---

Built with ❤️ for students worldwide
