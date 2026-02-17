// examples/visual-formatter-flow-tracking.ts
//
// 5. FLOW TRACKING (Request visualization)

import { createAdvancedFormatter, createLogger } from '../src';

export function runFlowTrackingDemo(): void {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔄 MODE 5: FLOW TRACKING\n');
    console.log('Best for: Tracing request flows through microservices\n');

    const flowLogger = createLogger({
        formatter: createAdvancedFormatter({
            mode: 'pretty',
            flowTracking: true,
            alignContext: true,
            showSeparators: false,
            colors: true,
            timestamp: true,
        }),
        context: {
            service: 'order-service',
        },
    });

    const requestId = 'req-flow-123';

    flowLogger.info('Order received', {
        requestId,
        orderId: 'ORD-12345',
        amount: 199.99,
    });

    flowLogger.info('Inventory checked', {
        requestId,
        available: true,
    });

    flowLogger.info('Payment processed', {
        requestId,
        paymentMethod: 'card',
    });

    flowLogger.info('Order confirmed', {
        requestId,
        status: 'confirmed',
    });

    console.log('\n');
}
