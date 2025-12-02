import React from 'react';
import { THEMES } from '../theme';

const DiaryView = ({ theme }) => {
    const styles = THEMES[theme];
    return (
        <div className={`h-screen flex items-center justify-center font-medium ${styles.textSec}`}>
            Diary View Coming Soon
        </div>
    );
};

export default DiaryView;
