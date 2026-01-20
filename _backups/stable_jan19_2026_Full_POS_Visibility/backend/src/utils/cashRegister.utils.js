const prisma = require('../db/prisma');

/**
 * Calculates the effective start date for counting sales for a cash register session.
 * This includes logic to "rescue" orphaned sales that occurred before the session opened
 * but within the same day (if no prior session covered them).
 * 
 * @param {Object} session - The active cash register session object.
 * @returns {Promise<Date>} - The start date for querying sales.
 */
async function getSessionSalesStartDate(session) {
    let startDate = session.openedAt;

    const now = new Date();
    const rdOffset = -4; // RD is UTC-4
    // Calculate start of today in RD time, converted to UTC
    const todayRD = new Date(now.getTime() + (rdOffset * 60 * 60 * 1000));
    todayRD.setUTCHours(0, 0, 0, 0);
    const todayStart = new Date(todayRD.getTime() - (rdOffset * 60 * 60 * 1000));

    // If the session was opened "today" (relative to RD time)
    if (session.openedAt >= todayStart) {
        // Check if there was a previously closed session today
        const lastClosedSession = await prisma.cashRegisterSession.findFirst({
            where: {
                status: 'closed',
                closedAt: {
                    gte: todayStart,
                    lt: session.openedAt
                }
            },
            orderBy: { closedAt: 'desc' }
        });

        // If there was a closed session, start AFTER it.
        // If NOT, start at BEGINNING OF DAY to catch any early (orphaned) sales.
        const computedStart = lastClosedSession ? lastClosedSession.closedAt : todayStart;

        // Only adopt this earlier start date if it effectively "rescues" time
        if (computedStart < session.openedAt) {
            startDate = computedStart;
        }
    }

    return startDate;
}

/**
 * Gets the start date for the "current" logical session, even if no session is explicitly open.
 * Useful for daily summary when register is closed (defaults to sales since last close or start of day).
 */
async function getCurrentSalesStartDate() {
    const activeSession = await prisma.cashRegisterSession.findFirst({
        where: { status: 'open' }
    });

    if (activeSession) {
        return getSessionSalesStartDate(activeSession);
    }

    // No active session: Show sales since last close or start of day
    const now = new Date();
    const rdOffset = -4;
    const todayRD = new Date(now.getTime() + (rdOffset * 60 * 60 * 1000));
    todayRD.setUTCHours(0, 0, 0, 0);
    const todayStart = new Date(todayRD.getTime() - (rdOffset * 60 * 60 * 1000));

    const lastClosedSession = await prisma.cashRegisterSession.findFirst({
        where: {
            status: 'closed',
            closedAt: { gte: todayStart }
        },
        orderBy: { closedAt: 'desc' }
    });

    return lastClosedSession ? lastClosedSession.closedAt : todayStart;
}

module.exports = {
    getSessionSalesStartDate,
    getCurrentSalesStartDate
};
