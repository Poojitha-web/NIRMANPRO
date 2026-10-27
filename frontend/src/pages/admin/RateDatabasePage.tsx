import React from 'react';
import { RateDatabaseAdminView } from '../../features/admin/RateDatabaseAdminView';

export const RateDatabasePage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <RateDatabaseAdminView />
    </div>
  );
};
