# SecureShare - Confidential Secret Sharing Platform

A robust, secure full-stack web application for confidential secret sharing built with Next.js, TypeScript, Prisma, tRPC, and Material UI.

## 🚀 Features

### Core Functionality

- **Secure Secret Creation**: Create time-limited, password-protected secrets
- **One-Time Access**: Secrets that self-destruct after being viewed once
- **Flexible Expiration**: Set custom expiration dates or no expiration
- **User Authentication**: Secure user registration and login
- **Personal Dashboard**: Manage all your secrets in one place
- **Search & Filter**: Find your secrets quickly with search functionality

### Security Features

- **Password Protection**: Optional password protection for extra security
- **Secure Hashing**: bcrypt for password hashing
- **Rate Limiting**: Protection against brute force attacks
- **Unique URLs**: Cryptographically secure random URL generation
- **Access Logging**: Track when and how often secrets are accessed
- **HTTPS Ready**: Built for secure communication

### User Experience

- **Responsive Design**: Works seamlessly on desktop and mobile
- **Modern UI**: Clean, intuitive interface with Material UI
- **Real-time Updates**: Live status updates and notifications
- **Copy to Clipboard**: Easy sharing with one-click URL copying
- **Edit Capabilities**: Update secret titles and expiration dates

## 🛠 Technology Stack

- **Frontend**: Next.js 14+ with TypeScript and App Router
- **UI Framework**: Material UI v7 with custom theming
- **Backend**: tRPC for type-safe API communication
- **Database**: Prisma ORM with SQLite
- **Authentication**: JWT-based authentication
- **Security**: bcrypt, rate limiting, input sanitization
- **Development**: ESLint, TypeScript strict mode

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd security
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your configuration:

   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-super-secret-jwt-key-here"
   ```

4. **Initialize the database**

   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔒 Security Measures

### Password Security

- bcrypt hashing with salt rounds
- Minimum password requirements
- Secure password verification

### Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Secret Creation**: 10 secrets per hour
- **Secret Access**: 20 accesses per 5 minutes
- **Authentication**: 5 attempts per 15 minutes

### Access Control

- JWT-based authentication
- User-specific secret ownership
- Protected API endpoints

### Data Protection

- Input sanitization and validation
- SQL injection prevention via Prisma
- XSS protection through React
- HTTPS-ready configuration

## 📱 Usage Examples

### Creating a Secret

1. Navigate to `/create`
2. Enter your secret content
3. Optionally set a title, password, and expiration
4. Choose one-time access if needed
5. Click "Create Secret"
6. Share the generated URL

### Accessing a Secret

1. Open the shared URL
2. Enter password if required
3. View the secret content
4. Secret is deleted if one-time access was enabled

### Managing Secrets

1. Login to your account
2. Visit `/dashboard`
3. View all your secrets
4. Edit titles and expiration dates
5. Delete secrets you no longer need
6. Search through your secrets

## 🧪 Development

### Build for Production

```bash
npm run build
```

### Run Linting

```bash
npm run lint
```

### Database Management

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Reset database
npm run db:reset

# Open Prisma Studio
npm run db:studio
```

### Type Checking

```bash
npm run type-check
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your GitHub repository to Vercel**
2. **Set environment variables:**

   - `DATABASE_URL`: Your production database URL
   - `JWT_SECRET`: A strong, random secret key

3. **For database, you can use:**
   - Vercel Postgres
   - PlanetScale
   - Railway PostgreSQL
   - Supabase

### Other Platforms

- **Netlify**: Add `vercel.json` build settings
- **Railway**: Set environment variables and connect GitHub
- **DigitalOcean App Platform**: Use Docker or buildpack

## 🔍 Features in Detail

### Secret Management

- **Create**: Simple form with optional password and expiration
- **View**: Password-protected access with one-time deletion
- **Edit**: Update title and expiration dates
- **Delete**: Permanent removal with confirmation
- **Search**: Real-time filtering by title or ID

### Security Implementation

- **bcrypt**: Password hashing with 12 salt rounds
- **JWT**: Stateless authentication with 7-day expiration
- **Rate Limiting**: Multiple tiers based on endpoint sensitivity
- **Input Validation**: Zod schemas for all API inputs
- **Access Logging**: Track secret access patterns

### User Experience

- **Responsive**: Mobile-first design with Material UI
- **Accessibility**: ARIA labels and keyboard navigation
- **Performance**: Optimized builds and lazy loading
- **Real-time**: Live updates and status changes

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
