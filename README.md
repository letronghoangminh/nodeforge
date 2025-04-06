# NodeForge

<p align="center">
  <img src="https://via.placeholder.com/200x200.png?text=NodeForge" alt="NodeForge Logo" width="200"/>
</p>

NodeForge is a modern Platform-as-a-Service (PaaS) solution similar to Heroku or Vercel, designed specifically for JavaScript application deployment. It simplifies the deployment process by connecting directly to your GitHub repositories and deploying both frontend and backend JavaScript frameworks to AWS infrastructure with minimal configuration.

## 🚀 Features

### GitHub Integration
- Connect your GitHub repositories with a few clicks
- Automatic deployments on push to specified branches
- Configure GitHub App installation per user account

### Deployment Options
- **Frontend Frameworks**: Deploy React, Vue, Angular, Next.js, and more via AWS Amplify
- **Backend Frameworks**: Deploy Node.js, Express, NestJS, and more via AWS ECS
- Custom deployment configurations with environment variables
- Custom domain and subdomain support

### Developer Experience
- Simple deployment workflow: connect repository → configure settings → deploy
- Real-time logs and monitoring through AWS CloudWatch integration
- Environment variable management for different deployment environments
- Custom deployment names and URLs

### Infrastructure
- Built on reliable AWS services (Amplify, ECS, SQS, Route53, etc.)
- Auto-scaling capabilities for production workloads
- Secure application deployment with proper IAM roles and security groups

### User Management
- User authentication and authorization
- Role-based access control
- Email verification for account security
- Password reset functionality

### Subscription Plans
- Free tier with limited resources
- Premium tier with advanced features and higher resource limits
- Stripe integration for subscription management

## 🔧 Tech Stack
- **Backend**: NestJS (TypeScript)
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT, Passport.js
- **Cloud Infrastructure**: AWS (Amplify, ECS, ECR, ALB, Route53, SQS, CloudWatch)
- **CI/CD**: GitHub integration
- **Payments**: Stripe
- **Containerization**: Docker

## 🛠️ Installation

### Prerequisites
- Node.js (v16+)
- npm (v8+)
- Docker and Docker Compose
- AWS account with appropriate permissions
- MySQL database

### Environment Setup
1. Clone the repository
```bash
git clone https://github.com/yourusername/nodeforge.git
cd nodeforge
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables (create a `.env` file based on `.env.example`)

4. Set up the database
```bash
npx prisma migrate dev
npx prisma db seed
```

## 🚀 Running the Application

### Development
```bash
# Run in development mode
npm run start:dev

# Run with debugging
npm run start:debug
```

### Production
```bash
# Build the application
npm run build

# Run in production mode
npm run start:prod
```

### Using Docker
```bash
# Build and run with Docker Compose
docker compose up

# Run in detached mode
docker compose up -d
```

## 📚 API Documentation
API documentation is available via Swagger UI at `/api/docs` when the application is running.

## 🧪 Testing
```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:cov

# Run end-to-end tests
npm run test:e2e
```

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

## 📬 Contact
If you have any questions or feedback, please reach out to us at [your-email@example.com](mailto:your-email@example.com).