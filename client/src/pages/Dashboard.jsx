import React from 'react';
import { 
  Book, 
  Scale, 
  Settings, 
  Users, 
  FileText, 
  CreditCard,
  PieChart,
  LayoutGrid
} from 'lucide-react';

export default function Dashboard({ onNavigate }) {
  const apps = [
    {
      id: 'ledger',
      title: 'General Ledger',
      icon: <Book className="w-10 h-10 text-white" />,
      color: 'bg-[#7C7BAD]', // Purple-ish
      action: () => onNavigate('ledger')
    },
    {
      id: 'trial-balance',
      title: 'Trial Balance',
      icon: <Scale className="w-10 h-10 text-white" />,
      color: 'bg-[#00A09D]', // Teal
      action: () => onNavigate('trial-balance')
    },
    {
      id: 'journal',
      title: 'Journal Entries',
      icon: <FileText className="w-10 h-10 text-white" />,
      color: 'bg-[#F0ad4e]', // Orange
      action: () => onNavigate('journal-entries')
    },
    // {
    //   id: 'partners',
    //   title: 'Partners',
    //   icon: <Users className="w-10 h-10 text-white" />,
    //   color: 'bg-[#337AB7]', // Blue
    //   action: () => alert('Feature coming soon')
    // },
    // {
    //   id: 'payments',
    //   title: 'Payments',
    //   icon: <CreditCard className="w-10 h-10 text-white" />,
    //   color: 'bg-[#D9534F]', // Red
    //   action: () => alert('Feature coming soon')
    // },
    // {
    //   id: 'reports',
    //   title: 'Reporting',
    //   icon: <PieChart className="w-10 h-10 text-white" />,
    //   color: 'bg-[#875A7B]', // Odoo Main Purple
    //   action: () => alert('Feature coming soon')
    // },
    // {
    //   id: 'config',
    //   title: 'Configuration',
    //   icon: <Settings className="w-10 h-10 text-white" />,
    //   color: 'bg-[#5F5E5E]', // Gray
    //   action: () => alert('Feature coming soon')
    // },
    // {
    //   id: 'apps',
    //   title: 'Apps',
    //   icon: <LayoutGrid className="w-10 h-10 text-white" />,
    //   color: 'bg-[#212121]', // Black
    //   action: () => alert('Feature coming soon')
    // }
  ];

  return (
    <div className="flex flex-col items-center justify-start pt-20 h-full">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-8 gap-y-10 max-w-6xl px-4">
        {apps.map((app) => (
          <div 
            key={app.id}
            onClick={app.action}
            className="group flex flex-col items-center gap-3 cursor-pointer transition-all hover:scale-105"
          >
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-[20px] shadow-sm flex items-center justify-center ${app.color} group-hover:shadow-md group-hover:brightness-110 transition-all`}>
              {app.icon}
            </div>
            <span className="text-gray-700 font-medium text-sm text-center group-hover:text-gray-900 leading-tight">
              {app.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
