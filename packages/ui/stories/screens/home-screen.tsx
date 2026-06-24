import MobileView from '../templates/mobile-view';
import NewReading from '../organisms/new-reading';
import QuickNav from '../molecules/quick-nav';
import React from 'react';

interface HomeScreenProps {
    onStart: () => void;
}
const HomeScreen = ({ onStart }: HomeScreenProps) => (
    <MobileView>
        <NewReading onStart={onStart} />
        <QuickNav />
    </MobileView>
);

export default HomeScreen;
