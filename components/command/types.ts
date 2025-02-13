import { ReactNode } from 'react';

export interface Command {
  id: string;
  name: string;
  shortcut?: string[];
  keywords?: string[];
  perform: () => void;
  icon?: ReactNode;
  parent?: string;
  section?: string;
}

export interface CommandGroup {
  name: string;
  commands: Command[];
}

export type CommandBarMode = 'default' | 'search' | 'nav';

export interface CommandContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  mode: CommandBarMode;
  setMode: (mode: CommandBarMode) => void;
  registerCommand: (command: Command) => void;
  unregisterCommand: (commandId: string) => void;
  commands: Command[];
}

export interface CommandProviderProps {
  children: ReactNode;
  initialCommands?: Command[];
} 