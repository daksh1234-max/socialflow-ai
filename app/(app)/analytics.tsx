import React from 'react';
import { ScreenWrapper } from '@/src/components/layout/ScreenWrapper';
import { Header } from '@/src/components/layout/Header';
import { EmptyState } from '@/src/components/feedback/EmptyState';
import { BarChart3 } from 'lucide-react-native';

export default function AnalyticsScreen() {
  return (
    <ScreenWrapper>
      <Header title="Analytics" />
      <EmptyState 
        icon={BarChart3}
        title="Check Back Later"
        description="We are still gathering data on your posts. Check back later to see your performance."
      />
    </ScreenWrapper>
  );
}
