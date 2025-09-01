# Miro Clone - Architectural Plan

## Project Vision
Real-time collaborative whiteboard application with enterprise-grade features, inspired by Miro. Focus on performance, collaboration, and user experience.

## Current State Analysis
- **Infrastructure**: Next.js 15 + Supabase backend fully configured
- **Core Features**: 80% complete (canvas tools, auth, templates, export)
- **UI Integration**: Completed but needs performance optimization
- **Tests**: 422/430 passing (98% success rate)
- **Critical Issues**: Environment config, security warnings, RLS optimization needed

## Requirements Summary

### Functional Requirements
1. **Canvas Tools**: Drawing, shapes, text, images, sticky notes ✅
2. **Real-time Collaboration**: Live cursors, presence, concurrent editing ⚠️
3. **Content Management**: Templates, export (PDF/PNG), sharing ✅
4. **Organization**: Layers, groups, grid snapping, search ✅
5. **Performance**: Handle 1000+ objects, WebGL acceleration ❌
6. **Security**: Auth, RBAC, RLS, 2FA ⚠️

### Non-Functional Requirements
- **Performance**: < 3s TTI, 60fps, < 50ms input latency
- **Scalability**: Support 100+ concurrent users per board
- **Reliability**: 99.9% uptime, offline mode support
- **Security**: OWASP compliance, data encryption
- **Accessibility**: WCAG AA compliance

## Architecture Design

### Frontend Architecture
```
┌─────────────────────────────────────────────┐
│           Next.js App Router                 │
├─────────────────────────────────────────────┤
│  Presentation Layer                          │
│  ├── Pages (App Router)                      │
│  ├── Components (React)                      │
│  └── UI Library (Radix + Tailwind)          │
├─────────────────────────────────────────────┤
│  Business Logic Layer                        │
│  ├── Canvas Managers                         │
│  ├── State Management (Zustand)              │
│  └── WebSocket Handlers                      │
├─────────────────────────────────────────────┤
│  Data Layer                                  │
│  ├── Supabase Client                         │
│  ├── WebSocket Client                        │
│  └── IndexedDB (Offline)                     │
└─────────────────────────────────────────────┘
```

### Backend Architecture
```
┌─────────────────────────────────────────────┐
│           Supabase Platform                  │
├─────────────────────────────────────────────┤
│  API Layer                                   │
│  ├── PostgREST (Auto-generated APIs)        │
│  ├── Edge Functions (Custom logic)           │
│  └── Realtime (WebSocket)                    │
├─────────────────────────────────────────────┤
│  Service Layer                               │
│  ├── Auth Service                            │
│  ├── Storage Service                         │
│  └── Vector Search                           │
├─────────────────────────────────────────────┤
│  Data Layer                                  │
│  ├── PostgreSQL Database                     │
│  ├── Row Level Security                      │
│  └── Database Functions                      │
└─────────────────────────────────────────────┘
```

### Data Flow
```
User Action → UI Component → Manager → 
State Update → WebSocket Broadcast → 
Supabase Persistence → Other Clients
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15.5.2 (App Router)
- **Language**: TypeScript 5.6.2 (strict mode)
- **Canvas**: Fabric.js 6.5.1
- **Styling**: Tailwind CSS 3.4.15
- **Animation**: Framer Motion 11.15.0
- **State**: Zustand 5.0.2
- **Forms**: React Hook Form
- **UI**: Radix UI, Shadcn/ui

### Backend
- **Platform**: Supabase
- **Database**: PostgreSQL 15
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth
- **Edge Functions**: Deno runtime
- **Cache**: Redis (future)

### DevOps
- **Hosting**: Vercel (frontend)
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry
- **Testing**: Jest, RTL, Playwright
- **Analytics**: PostHog (future)

## Database Schema

### Core Tables
```sql
-- Users (managed by Supabase Auth)

-- Boards
boards (
  id, title, description, thumbnail_url,
  created_by, created_at, updated_at,
  is_public, settings
)

-- Board Elements
board_elements (
  id, board_id, type, data, position,
  style, created_by, created_at, updated_at
)

-- Collaborators
board_collaborators (
  board_id, user_id, role, joined_at
)

-- Comments
comments (
  id, board_id, element_id, user_id,
  content, parent_id, created_at
)

-- Templates
board_templates (
  id, name, description, category,
  thumbnail_url, data, is_public
)
```

### Security Policies
- RLS enabled on all tables
- Optimized auth.uid() queries needed (28 policies)
- Role-based permissions
- Public/private board access

## Implementation Phases

### Phase 1: Critical Fixes (P0) - Immediate
1. Fix DATABASE_URL configuration
2. Enable security features (MFA, password protection)
3. Optimize RLS policies (28 policies need optimization)
4. Add missing database indexes
5. Fix failing tests (6 UIIntegration tests)

### Phase 2: Performance (P1) - Next Sprint
1. WebGL renderer integration
2. Viewport culling implementation
3. Level-of-detail rendering
4. WebSocket message batching
5. Client-side caching

### Phase 3: Collaboration (P1) - Sprint 2
1. CRDT implementation for conflict resolution
2. Visual merge indicators
3. Collaborative selection boxes
4. Presence optimization

### Phase 4: Mobile (P2) - Sprint 3
1. Responsive layouts
2. Touch gesture handlers
3. Mobile-optimized controls
4. PWA implementation

### Phase 5: Enterprise (P3) - Future
1. SSO integration
2. Advanced permissions
3. Audit logging
4. Compliance features

## Risk Assessment

### Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| WebGL compatibility | High | Medium | Fallback to Canvas 2D |
| WebSocket scaling | High | Medium | Message queue, batching |
| CRDT complexity | Medium | High | Use proven library (Yjs) |
| Mobile performance | Medium | Medium | Progressive enhancement |
| Database performance | High | High | Index optimization, caching |

### Business Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Feature scope creep | High | High | Strict prioritization |
| Performance targets | High | Medium | Early optimization |
| Security vulnerabilities | High | Low | Regular audits |
| User adoption | Medium | Medium | Focus on UX |

## Performance Targets
- **Initial Load**: < 3s (LCP)
- **Interactivity**: < 100ms (FID)
- **Frame Rate**: 60fps constant
- **Canvas Operations**: < 16ms
- **Save Latency**: < 500ms
- **WebSocket Latency**: < 100ms

## Security Considerations
- **Authentication**: Supabase Auth with MFA (needs enabling)
- **Authorization**: RBAC with RLS (needs optimization)
- **Data Protection**: TLS encryption
- **Input Validation**: Server-side validation
- **XSS Prevention**: Content sanitization
- **CSRF Protection**: Token validation
- **Password Protection**: Leaked password check (needs enabling)

## Monitoring Strategy
- **Error Tracking**: Sentry integration
- **Performance**: Web Vitals monitoring
- **User Analytics**: Event tracking
- **System Health**: Status page
- **Database**: Query performance
- **WebSocket**: Connection metrics

## Testing Strategy
- **Unit Tests**: 80% coverage target
- **Integration**: API testing
- **E2E**: Critical user journeys
- **Performance**: Load testing
- **Security**: Penetration testing
- **Accessibility**: WCAG validation

## Deployment Strategy
- **Environments**: Dev → Staging → Production
- **Rollout**: Feature flags, gradual rollout
- **Rollback**: Automated rollback on errors
- **Database**: Migration validation
- **Monitoring**: Real-time alerts

## Success Metrics
- **User Engagement**: DAU/MAU > 40%
- **Performance**: P95 < 100ms response
- **Reliability**: 99.9% uptime
- **Quality**: < 1% error rate
- **Satisfaction**: NPS > 50

## Dependencies
- Supabase platform availability
- Fabric.js library maintenance
- WebSocket infrastructure
- CDN performance
- Third-party auth providers

## Constraints
- Browser WebGL support
- WebSocket connection limits
- Database connection pooling
- Storage quotas
- Rate limiting

## Critical Path Items
1. **Environment Configuration**: DATABASE_URL must be fixed
2. **Security**: MFA and password protection critical for production
3. **Performance**: RLS optimization blocking scalability
4. **Testing**: 6 failing tests need resolution
5. **Duplicate Work**: Verify cycle 46 vs PR #49

## Supabase Integration Points
- **Database**: 28 RLS policies need optimization
- **Auth**: MFA and password protection disabled
- **Storage**: Image upload integration complete
- **Realtime**: WebSocket channels configured
- **Edge Functions**: Available for complex operations

## Next Steps
1. Fix critical environment and security issues
2. Optimize database performance (indexes, RLS)
3. Resolve test failures
4. Implement WebGL rendering
5. Add CRDT for collaboration
6. Create mobile experience

## Decision Log
- **Canvas Library**: Fabric.js chosen for maturity and features
- **State Management**: Zustand for simplicity and performance
- **Database**: Supabase for integrated auth/realtime/storage
- **Deployment**: Vercel for optimal Next.js integration
- **Testing**: Jest + Playwright for comprehensive coverage
- **Manager Pattern**: Separation of concerns for canvas features
- **Event-Driven**: Canvas events trigger manager actions

## Technical Debt
- Duplicate code between cycles needs consolidation
- Manager implementations need UI wiring
- Error handling inconsistent across modules
- Logging infrastructure incomplete
- Documentation gaps in API and architecture

## Conclusion
The Miro clone project has solid foundations with 80% of core features complete. Critical issues around environment configuration, security, and performance optimization must be addressed before production deployment. The architecture supports scalability, but immediate focus should be on fixing P0 issues rather than adding new features.