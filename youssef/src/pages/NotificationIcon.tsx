import { Bell } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

type NotificationIconProps = {
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

const NotificationIcon: React.FC<NotificationIconProps> = ({ onClick }) => {
    const { hasUnread } = useNotification();

    return (
        <button onClick={onClick} className="relative">
            <Bell size={20} className={hasUnread ? 'text-green-600' : ''} />
            {hasUnread && (
                <>
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                </>
            )}
        </button>
    );
};

export default NotificationIcon;
