import React from 'react';
import {
  FlaskConical,
  Microscope,
  Dna,
  TestTube,
  Activity,
  HeartPulse,
  Stethoscope,
  ShieldCheck,
  Calendar,
  Send,
  Users,
  AlertTriangle,
  GraduationCap
} from 'lucide-react';

interface LabIconProps {
  name?: string;
  className?: string;
}

export const LabIcon: React.FC<LabIconProps> = ({ name, className = 'w-4 h-4' }) => {
  switch (name?.toLowerCase()) {
    case 'microscope':
      return <Microscope className={className} />;
    case 'dna':
      return <Dna className={className} />;
    case 'flask':
    case 'flaskconical':
      return <FlaskConical className={className} />;
    case 'testtube':
      return <TestTube className={className} />;
    case 'activity':
      return <Activity className={className} />;
    case 'heartpulse':
      return <HeartPulse className={className} />;
    case 'stethoscope':
      return <Stethoscope className={className} />;
    case 'shieldcheck':
      return <ShieldCheck className={className} />;
    case 'send':
      return <Send className={className} />;
    case 'users':
      return <Users className={className} />;
    case 'alerttriangle':
      return <AlertTriangle className={className} />;
    case 'graduationcap':
      return <GraduationCap className={className} />;
    default:
      return <Calendar className={className} />;
  }
};
