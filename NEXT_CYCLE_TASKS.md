# Next Cycle Tasks

## Priority 0 (Critical - Must Fix)
1. **Fix TypeScript Build Error**
   - File: `monitoring/sentry-production.config.ts:42`
   - Issue: Invalid 'staging' case in NODE_ENV switch
   - Solution: Remove the staging case or update NODE_ENV type definition
   - Verify: Run `npm run build` to confirm fix

## Priority 1 (High - Post-Fix)
1. **Merge PR #32**
   - After build fix is verified
   - Ensure all tests still pass
   - Update PR with fix commit

2. **Configure Production Credentials**
   - Set Sentry DSN in environment variables
   - Configure Vercel deployment token
   - Set up Railway API credentials
   - Configure Supabase connection string
   - Set up Upstash Redis URL

3. **Deploy to Production**
   - Deploy frontend to Vercel
   - Deploy WebSocket server to Railway
   - Run deployment verification script
   - Monitor initial deployment metrics

## Priority 2 (Medium - Enhancements)
1. **Monitor Production**
   - Verify Sentry is capturing errors
   - Check health endpoints are responding
   - Monitor performance metrics
   - Set up alerting rules

2. **Documentation Updates**
   - Update README with production URLs
   - Document deployment process results
   - Create runbook for common issues

## Technical Debt
- Consider adding 'staging' to NODE_ENV type if needed
- Review and optimize bundle size
- Add more comprehensive E2E tests
- Implement automated rollback procedures

## Deferred from Current Cycle
- None - all planned features were implemented

## Success Criteria
- [ ] Build passes without errors
- [ ] All 311 tests continue to pass
- [ ] PR #32 merged to main
- [ ] Frontend deployed and accessible
- [ ] WebSocket server connected
- [ ] Health checks returning 200
- [ ] Monitoring capturing data
