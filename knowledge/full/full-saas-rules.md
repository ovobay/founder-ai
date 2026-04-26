# Full SaaS Planning Rules

When mode is Full SaaS Plan, always output these sections in order:

1. Product Overview
2. Target Users
3. Core Workflow
4. Core Features
5. Frontend Structure
6. Backend Architecture
7. Database Tables
8. API Endpoints
9. Pricing Model
10. Marketing Plan
11. Sales Strategy
12. Launch Checklist

## Product Rules

Always define:
- The target customer
- The pain point
- The promised outcome
- The first valuable workflow
- The reason the product is different

Avoid vague product descriptions.

## Frontend Rules

Include both marketing pages and authenticated app pages.

Marketing pages:
- Homepage
- Pricing
- Features
- Use cases
- Contact/demo
- Login/signup

Authenticated app pages:
- Dashboard
- Main workspace
- Settings
- Billing
- Team members
- Notifications
- Reports/analytics

For dashboards:
- Use clean left navigation
- Use clear empty states
- Use responsive layouts
- Avoid clutter
- Make every button action-driven

## Backend Rules

For SaaS apps, always include:
- users
- organisations
- organisation_members
- roles
- permissions
- subscriptions
- billing_events
- audit_logs
- notifications
- settings

For helpdesk SaaS, also include:
- tickets
- ticket_messages
- ticket_comments
- ticket_assignments
- ticket_status_history
- sla_policies
- knowledge_articles
- tags
- attachments
- integrations

Never store plain text passwords.
Use authentication provider IDs instead.

## API Rules

Use production-style endpoints.

Examples:
- POST /api/tickets
- GET /api/tickets
- GET /api/tickets/:id
- PATCH /api/tickets/:id
- POST /api/tickets/:id/messages
- POST /api/tickets/:id/assign
- GET /api/organisations/:id/members
- POST /api/billing/create-checkout-session
- POST /api/webhooks/stripe

Avoid weak endpoints like:
- /api/tickets/create
- /api/tickets/update
- /api/doSomething

## Pricing Rules

Default SaaS pricing:
- Starter
- Growth
- Enterprise

Growth should usually be highlighted as Most Popular.

Enterprise should usually be:
- Custom pricing
- Talk to sales

Pricing should include:
- monthly and annual billing
- plan limits
- support levels
- usage limits
- billing FAQs
- cancellation FAQs

## Marketing Rules

Marketing plan must include:
- positioning
- target audience
- landing page message
- launch channels
- content ideas
- social proof plan
- email sequence
- demo strategy

Avoid vague advice like “use social media”.

## Sales Rules

Sales strategy must include:
- ideal customer profile
- lead source
- outreach message
- demo flow
- objections
- follow-up sequence
- conversion goal

## Launch Checklist

Always include:
- landing page live
- analytics installed
- auth tested
- billing tested
- onboarding tested
- email sending tested
- error monitoring enabled
- first 10 beta users identified

## Production-Grade Backend Rules

- Always assume multi-tenant SaaS (multiple companies using the same system)

Must include these tables:
- organisations
- organisation_members
- roles
- permissions
- subscriptions
- billing_events
- audit_logs
- notifications

Helpdesk-specific tables must include:
- tickets
- ticket_messages
- ticket_comments
- ticket_assignments
- ticket_status_history
- sla_policies
- tags
- attachments
- knowledge_articles

Never:
- recommend storing plain passwords
- mix user data without organisation separation

## Architecture Rules

- Default to a modular monolith for MVP
- Avoid recommending microservices unless explicitly requested
- Keep architecture simple and scalable

## Authentication Rules

- Use providers like:
  - Supabase Auth
  - Clerk
  - Auth0

- Never build auth from scratch for MVP
- Use user_id from auth provider

## Pricing Corrections

- Enterprise plan should be:
  - Custom pricing
  - "Talk to Sales"
  - Not a fixed number

- Growth plan must:
  - be highlighted as Most Popular
  - contain best value

## Marketing Upgrade Rules

Marketing must include:
- ONE primary acquisition channel (e.g. LinkedIn outbound)
- Example messaging (not generic advice)
- Specific content ideas

Bad:
- "use social media"

Good:
- "Post weekly LinkedIn threads targeting IT managers about ticket SLA failures"

## Sales Upgrade Rules

Sales must include:
- Ideal Customer Profile (ICP)
- Example cold outreach message
- Demo structure:
  - Problem → Live product → Outcome
- Follow-up sequence (Day 1, Day 3, Day 7)

## Launch Checklist Upgrade

Must include:
- Analytics (PostHog / GA)
- Error monitoring (Sentry)
- Auth working
- Billing working (Stripe)
- Email sending working
- First 10 beta users identified
- Feedback loop system


### 1. Product Overview
HelpdeskHub is a cloud-based helpdesk software designed specifically for small IT teams. It enables organizations to streamline their support processes, improve customer satisfaction, and enhance team collaboration. The platform provides intuitive ticket management, automated workflows, and detailed reporting analytics to make IT support efficient and effective.

### 2. Target Users
- Small to medium-sized IT teams
- Managed Service Providers (MSPs)
- Startups and tech organizations looking for efficient customer support solutions

### 3. Core Workflow
1. **Ticket Creation**: Customers submit support requests via the web portal, email, or chat.
2. **Ticket Assignment**: Tickets are automatically assigned to available team members based on predefined rules.
3. **Resolution Process**: Team members analyze, collaborate, and resolve the issues.
4. **Customer Feedback**: After resolution, customers rate their experience, providing valuable feedback.
5. **Reporting**: Data is aggregated for insights on performance and areas for improvement.

### 4. Core Features
- **Ticket Management**: Organize, prioritize, and track support tickets.
- **Automated Workflows**: Set rules for ticket assignments and escalations.
- **Knowledge Base**: Self-service documentation for customers.
- **Performance Analytics**: Reporting tools to monitor team performance and ticket resolution times.
- **Multi-channel Support**: Integrate support channels like email, chat, and phone.
- **User Roles & Permissions**: Custom roles for team members with specific access levels.

### 5. Frontend Structure
- **Dashboard**: Overview of ticket status, team performance, and analytics.
- **Tickets Page**: List view of all tickets with filters for status, priority, and assignee.
- **Knowledge Base**: Searchable articles and FAQs for self-help.
- **User Management**: Interface for adding/removing team members and managing roles.
- **Settings Page**: Configuration options for notifications, branding, and integrations.
- **Feedback Module**: Customer ratings and comments after ticket resolution.

### 6. Backend Architecture
- **Microservices-based architecture**: Segregates functionality into small, manageable services for ticketing, user management, and reporting.
- **Authentication Service**: Handles user registration, login, and permission validations.
- **Ticket Processing Service**: Manages the creation, updates, and closures of tickets with logic for automation.
- **Notification Service**: Sends emails, alerts, and updates to users regarding ticket status.

### 7. Database Tables
1. **Users**: UserID, Name, Email, Role, PasswordHash, CreatedAt
2. **Tickets**: TicketID, UserID, Status, Priority, AssignedTo, CreatedAt, UpdatedAt, ResolvedAt
3. **Comments**: CommentID, TicketID, UserID, CommentText, CreatedAt
4. **KnowledgeBase**: ArticleID, Title, Content, CreatedBy, CreatedAt
5. **Feedback**: FeedbackID, TicketID, UserID, Rating, Comment, CreatedAt

### 8. API Endpoints
- **POST /api/users**: Register a new user
- **GET /api/users/{id}**: Retrieve user details
- **POST /api/tickets**: Create a new ticket
- **GET /api/tickets**: List all tickets
- **PUT /api/tickets/{id}**: Update a specific ticket
- **GET /api/knowledgebase**: Retrieve knowledge base articles
- **POST /api/feedback**: Submit feedback for a ticket

### 9. Pricing Model
| Feature/Plan     | Starter            | Growth (Most Popular) | Enterprise          |
|------------------|-------------------|-----------------------|----------------------|
| Users            | 5 Users           | 15 Users              | 50 Users             |
| Usage            | 100 Tickets/Month  | 500 Tickets/Month     | Unlimited Tickets     |
| Storage          | 10 GB             | 100 GB                | 500 GB               |
| Support          | Email Support      | 24/7 Email & Chat     | Dedicated Account Rep  |
| Automation       | Basic              | Advanced              | Full Automation       |

- **Monthly Billing**: $29/month (Starter), $79/month (Growth), $199/month (Enterprise)
- **Annual Billing**: Save 20%! 
  - Starter: $279/year
  - Growth: $759/year
  - Enterprise: $1,999/year 

Strong CTAs:
- **Starter**: Start My Free Trial
- **Growth**: Power My Team Now
- **Enterprise**: Talk to Sales

### 10. Marketing Plan
- **Content Marketing**: Create blog posts on IT support best practices, case studies, and guides.
- **SEO Strategy**: Optimize website and content for keywords related to helpdesk software.
- **Social Media**: Engage users through LinkedIn and Twitter sharing tips, testimonials, and product updates.
- **Webinars**: Host monthly webinars showcasing product features and industry insights.
- **Email Campaigns**: Nurture leads through targeted email sequences offering free trials and resources.

### 11. Sales Strategy
- **Freemium Model**: Offer a 14-day free trial for the Growth plan to attract potential users.
- **Lead Scoring**: Focus on high-value leads based on engagement and interest shown.
- **Consultative Selling**: Train sales reps to offer tailored solutions based on user needs during demos.
- **Follow-up Process**: Develop a structured follow-up system for trial users to convert them to paying customers.

### 12. Launch Checklist
- [ ] Finalize product development and testing.
- [ ] Create marketing assets (website, promotional materials).
- [ ] Set up social media profiles and content calendar.
- [ ] Prepare email campaigns and target lists.
- [ ] Schedule and promote launch webinar/demo.
- [ ] Prepare customer support materials and knowledge base.
- [ ] Start the marketing campaign leading up to launch day.
- [ ] Officially launch with an announcement across all channels.
- [ ] Monitor user engagement and feedback continuously post-launch.