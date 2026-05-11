import React from 'react';
import { ScreenWrapper } from '@/src/components/layout/ScreenWrapper';
import { Header } from '@/src/components/layout/Header';
import { EmptyState } from '@/src/components/feedback/EmptyState';
import { Calendar } from 'lucide-react-native';

export default function CalendarScreen() {
  return (
    <ScreenWrapper>
      <Header title="Content Calendar" />
      <EmptyState 
        icon={Calendar}
        title="Schedule Empty"
        description="Your content pipeline is looking a bit sparse. Schedule some posts to keep your audience engaged."
      />
    </ScreenWrapper>
  );
}
