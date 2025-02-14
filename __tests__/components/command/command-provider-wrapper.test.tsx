import { CommandProviderWrapper } from '@/components/providers/command-provider-wrapper';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Action, KBarQuery, useKBar } from 'kbar';
import React from 'react';

// Mock kbar hooks and types
type PartialKBarQuery = Pick<KBarQuery, 'toggle' | 'setCurrentRootAction' | 'setVisualState'>;

// Mock implementation of toggle function
const mockToggleImpl = () => {
  // Mock implementation
};

jest.mock('kbar', () => ({
  useKBar: jest.fn(() => ({
    query: {
      toggle: jest.fn(mockToggleImpl),
      setCurrentRootAction: jest.fn(),
      setVisualState: jest.fn(),
    } as PartialKBarQuery
  })),
  KBarProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useRegisterActions: jest.fn(),
  createAction: jest.fn(),
}));

describe('CommandProviderWrapper', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Core Provider Setup', () => {
    it('should render without crashing', () => {
      const { getByText } = render(
        <CommandProviderWrapper>
          <div>Test Child</div>
        </CommandProviderWrapper>
      );
      expect(getByText('Test Child')).toBeInTheDocument();
    });

    it('should initialize with default actions', () => {
      const { useRegisterActions } = require('kbar');
      render(
        <CommandProviderWrapper>
          <div>Test Content</div>
        </CommandProviderWrapper>
      );
      
      expect(useRegisterActions).toHaveBeenCalled();
      // Verify that system commands are registered
      const registeredActions = useRegisterActions.mock.calls[0][0];
      expect(registeredActions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            perform: expect.any(Function),
          })
        ])
      );
    });
  });

  describe('Command Registration', () => {
    it('should register system commands', () => {
      const { useRegisterActions } = require('kbar');
      render(
        <CommandProviderWrapper>
          <div>Test Content</div>
        </CommandProviderWrapper>
      );
      
      const registeredActions = useRegisterActions.mock.calls[0][0];
      const systemCommands = registeredActions.filter(
        (action: Action) => action.section === 'System'
      );
      
      expect(systemCommands.length).toBeGreaterThan(0);
      systemCommands.forEach((command: Action) => {
        expect(command).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          section: 'System',
          perform: expect.any(Function),
        });
      });
    });

    it('should register navigation commands', () => {
      const { useRegisterActions } = require('kbar');
      render(
        <CommandProviderWrapper>
          <div>Test Content</div>
        </CommandProviderWrapper>
      );
      
      const registeredActions = useRegisterActions.mock.calls[0][0];
      const navigationCommands = registeredActions.filter(
        (action: Action) => action.section === 'Navigation'
      );
      
      expect(navigationCommands.length).toBeGreaterThan(0);
      navigationCommands.forEach((command: Action) => {
        expect(command).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          section: 'Navigation',
          perform: expect.any(Function),
        });
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should handle command palette toggle shortcut', async () => {
      const mockToggle = jest.fn(mockToggleImpl);
      const mockQuery: PartialKBarQuery = {
        toggle: mockToggle,
        setCurrentRootAction: jest.fn(),
        setVisualState: jest.fn(),
      };
      (useKBar as jest.Mock).mockReturnValue({
        query: mockQuery
      });

      render(
        <CommandProviderWrapper>
          <div>Test Content</div>
        </CommandProviderWrapper>
      );
      
      // Simulate CMD+K / Ctrl+K using userEvent
      await userEvent.keyboard('{Meta>}k{/Meta}');
      
      expect(mockToggle).toHaveBeenCalled();
    });
  });

  describe('Command Execution', () => {
    it('should execute commands when triggered', async () => {
      const { useRegisterActions } = require('kbar');
      const mockPerform = jest.fn();
      
      // Mock a test command
      const testCommand: Action = {
        id: 'test-command',
        name: 'Test Command',
        perform: mockPerform,
        section: 'System',
      };

      // Register the test command
      useRegisterActions.mockImplementationOnce((actions: Action[]) => {
        actions.forEach((action) => {
          if (action.id === testCommand.id) {
            action.perform();
          }
        });
      });

      render(
        <CommandProviderWrapper>
          <div>Test Content</div>
        </CommandProviderWrapper>
      );
      
      // Verify the command was registered and executed
      expect(useRegisterActions).toHaveBeenCalled();
      expect(mockPerform).toHaveBeenCalled();
    });
  });
}); 