const validPayload = (payload) => (
  payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : null
);

export const PortalReadModelDTO = {
  fromRecord: (record) => {
    const payload = validPayload(record?.payload);

    if (!payload) {
      return null;
    }

    return {
      payload,
      version: Number(record.version || 1),
      publishedAt: record.published_at || null,
      updatedAt: record.updated_at || null
    };
  }
};

export const InvestorReadModelDTO = {
  fromRecords: (records = [], profileId = '') => {
    const ownRecord = records.find((record) => record.profile_id === profileId);
    const generalRecord = records.find((record) => record.profile_id === null);
    return PortalReadModelDTO.fromRecord(ownRecord || generalRecord || null);
  }
};
