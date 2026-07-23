const isSuccess = (module) => module?.moduleState?.status === 'success';
const asNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const asText = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';
const asDate = (item) => asText(item?.publishedAt, item?.published_at, item?.date, item?.updatedAt, item?.updated_at);
const isCompleted = (status) => ['completed', 'complete', 'done', 'concluido'].includes(
  String(status || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
);

const findInvestorPosition = (investors, profileId) => {
  if (!isSuccess(investors) || !profileId) return null;
  return investors.capTable.find((item) => (
    item.profileId === profileId
    || item.profile_id === profileId
    || item.userId === profileId
    || item.user_id === profileId
  )) || null;
};

export const ExecutiveDashboardDTO = {
  fromModules: ({ investors, roadmap, projects, updates, documents, profileId }) => {
    const investorDataAvailable = isSuccess(investors);
    const summary = investorDataAvailable ? investors.summary : {};
    const totalCaptured = investorDataAvailable ? asNumber(summary.paidCapital) : null;
    const explicitTarget = asNumber(summary.plannedCapital);
    const totalQuotas = asNumber(investors.totalQuotas);
    const quotaValue = asNumber(investors.quotaValue);
    const calculatedTarget = totalQuotas !== null && quotaValue !== null ? totalQuotas * quotaValue : null;
    const fundraisingTarget = explicitTarget ?? (
      investorDataAvailable && calculatedTarget > 0 ? calculatedTarget : null
    );
    const targetPercentage = totalCaptured !== null && fundraisingTarget > 0
      ? (totalCaptured / fundraisingTarget) * 100
      : null;
    const position = findInvestorPosition(investors, profileId);
    const investedAmount = position
      ? asNumber(position.paidAmount ?? position.investedAmount ?? position.paid_amount)
      : null;
    const participationPercentage = position
      ? asNumber(position.ownershipPercentage ?? position.ownership_percentage)
      : null;

    const milestones = isSuccess(roadmap) ? roadmap.milestones : [];
    const nextMilestoneItem = milestones.find((item) => !isCompleted(item.status));
    const nextMilestone = nextMilestoneItem ? {
      title: asText(nextMilestoneItem.title, nextMilestoneItem.name, nextMilestoneItem.label),
      description: asText(nextMilestoneItem.description, nextMilestoneItem.summary),
      date: asText(nextMilestoneItem.targetDate, nextMilestoneItem.target_date, nextMilestoneItem.date)
    } : null;

    const publishedUpdates = isSuccess(updates)
      ? updates.updates
        .filter((item) => String(item.status || '').toLowerCase() === 'publicado')
        .sort((a, b) => new Date(asDate(b) || 0) - new Date(asDate(a) || 0))
      : [];
    const latestUpdateItem = publishedUpdates[0];
    const latestUpdate = latestUpdateItem ? {
      title: asText(latestUpdateItem.title, latestUpdateItem.name),
      description: asText(latestUpdateItem.summary, latestUpdateItem.description, latestUpdateItem.content),
      date: asDate(latestUpdateItem)
    } : null;

    const recentDocuments = isSuccess(documents)
      ? [...documents.documents]
        .sort((a, b) => new Date(asDate(b) || 0) - new Date(asDate(a) || 0))
        .slice(0, 3)
        .map((item) => ({
          title: asText(item.title, item.name),
          category: asText(item.category, item.type),
          date: asDate(item)
        }))
      : [];

    const projectDataAvailable = isSuccess(projects);
    const mvpProgress = projectDataAvailable ? asNumber(projects.summary?.progress) : null;
    const projectReleases = projectDataAvailable && Array.isArray(projects.summary?.upcomingDeliveries)
      ? projects.summary.upcomingDeliveries
      : [];
    const roadmapReleases = milestones
      .filter((item) => !isCompleted(item.status))
      .map((item) => asText(item.title, item.name, item.label))
      .filter(Boolean);

    return {
      metrics: {
        totalCaptured,
        fundraisingTarget,
        targetPercentage,
        investedAmount,
        participationPercentage
      },
      nextMilestone,
      latestUpdate,
      recentDocuments,
      mvpProgress,
      upcomingReleases: (projectReleases.length ? projectReleases : roadmapReleases).slice(0, 4)
    };
  }
};
