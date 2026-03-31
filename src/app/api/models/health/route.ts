import { NextResponse } from 'next/server';
import { getRankedModels, isCacheStale } from '@/lib/model-health-service';

/**
 * Debug endpoint for model health rankings
 * GET /api/models/health
 * Returns current model health status for debugging
 */
export async function GET() {
  try {
    const rankedModels = await getRankedModels();
    const stale = isCacheStale();
    const lastUpdated = new Date().toISOString();

    // Transform models to response format with calculated status
    const models = rankedModels.map((model) => {
      const stabilityScore = model.health?.stabilityScore ?? 0;

      // Calculate status based on stability score
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (stabilityScore >= 80) {
        status = 'healthy';
      } else if (stabilityScore >= 50) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        id: model.id,
        tier: model.tier?.tier ?? 'S+',
        contextWindow: model.contextWindow ?? 128000,
        stabilityScore,
        p95Latency: model.health?.p95Latency ?? 0,
        reliability: model.health?.reliability ?? 0,
        lastTested: model.health?.lastHealthCheck
        ? new Date(model.health.lastHealthCheck).toISOString()
        : lastUpdated,
        status,
      };
    });

    return NextResponse.json({
      lastUpdated,
      isStale: stale,
      models,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ModelHealthEndpoint] Error:', message);

    return NextResponse.json(
      {
        error: 'Failed to retrieve model health rankings',
        message,
      },
      { status: 500 }
    );
  }
}
