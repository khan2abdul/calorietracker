import React from 'react';
import { THEMES } from '../theme';

const UserProfileView = ({ theme }) => {
    const styles = THEMES[theme];
    return (
        <div className={`h-screen flex items-center justify-center font-medium ${styles.textSec}`}>
            Profile View Coming Soon
        </div>
    );
};

export default UserProfileView;
