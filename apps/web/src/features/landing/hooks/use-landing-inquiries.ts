import { useCallback, useEffect, useState } from 'react';

import {
  DEFAULT_SALESPERSONS,
  type InquiryStatus,
  type LandingInquiry,
  type Salesperson,
  addInquiryActivityNote,
  assignSalespersonToInquiry,
  createLandingInquiry,
  deleteLandingInquiry,
  exportInquiriesCsv,
  getLandingInquiries,
  resetLandingInquiriesDemo,
  updateInquiryStatus,
} from '../services/landing-leads-service';

export function useLandingInquiries() {
  const [inquiries, setInquiries] = useState<LandingInquiry[]>(() => getLandingInquiries());
  const [salespersons, setSalespersons] = useState<Salesperson[]>(DEFAULT_SALESPERSONS);
  const [isLoading, setIsLoading] = useState(false);

  const refreshInquiries = useCallback(() => {
    setInquiries(getLandingInquiries());
  }, []);

  useEffect(() => {
    // Listen for cross-tab or same-window custom events
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'kola_solar_landing_inquiries_v1') {
        refreshInquiries();
      }
    };

    const handleCustomUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<LandingInquiry[]>;
      if (customEvent.detail) {
        setInquiries(customEvent.detail);
      } else {
        refreshInquiries();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('kola_inquiries_updated', handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('kola_inquiries_updated', handleCustomUpdate);
    };
  }, [refreshInquiries]);

  const submitInquiry = useCallback(
    (
      data: Omit<
        LandingInquiry,
        'id' | 'created_at' | 'updated_at' | 'status' | 'activity_log' | 'synced_to_crm'
      >,
    ) => {
      setIsLoading(true);
      try {
        const created = createLandingInquiry(data);
        setInquiries(getLandingInquiries());
        return created;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const assignSalesperson = useCallback(
    (
      inquiryId: string,
      salesperson: { id: string; name: string; email: string; role?: string },
      actor = 'Admin',
    ) => {
      const updated = assignSalespersonToInquiry(inquiryId, salesperson, actor);
      if (updated) {
        setInquiries(getLandingInquiries());
      }
      return updated;
    },
    [],
  );

  const changeStatus = useCallback(
    (inquiryId: string, status: InquiryStatus, notes?: string, actor = 'Admin') => {
      const updated = updateInquiryStatus(inquiryId, status, notes, actor);
      if (updated) {
        setInquiries(getLandingInquiries());
      }
      return updated;
    },
    [],
  );

  const addNote = useCallback((inquiryId: string, noteText: string, actor = 'Admin') => {
    const updated = addInquiryActivityNote(inquiryId, noteText, actor);
    if (updated) {
      setInquiries(getLandingInquiries());
    }
    return updated;
  }, []);

  const removeInquiry = useCallback((inquiryId: string) => {
    const success = deleteLandingInquiry(inquiryId);
    if (success) {
      setInquiries(getLandingInquiries());
    }
    return success;
  }, []);

  const resetToDemo = useCallback(() => {
    const demo = resetLandingInquiriesDemo();
    setInquiries(demo);
  }, []);

  const exportCsv = useCallback(() => {
    exportInquiriesCsv(inquiries);
  }, [inquiries]);

  // Derived stats
  const totalCount = inquiries.length;
  const unassignedCount = inquiries.filter((inq) => !inq.assigned_salesperson_id).length;
  const newCount = inquiries.filter((inq) => inq.status === 'new').length;
  const assignedCount = inquiries.filter((inq) => inq.status === 'assigned').length;
  const contactedCount = inquiries.filter((inq) => inq.status === 'contacted').length;
  const demoCount = inquiries.filter((inq) => inq.status === 'demo_scheduled').length;
  const convertedCount = inquiries.filter((inq) => inq.status === 'converted').length;

  return {
    inquiries,
    salespersons,
    setSalespersons,
    isLoading,
    submitInquiry,
    assignSalesperson,
    changeStatus,
    addNote,
    removeInquiry,
    resetToDemo,
    exportCsv,
    refreshInquiries,
    stats: {
      totalCount,
      unassignedCount,
      newCount,
      assignedCount,
      contactedCount,
      demoCount,
      convertedCount,
    },
  };
}
