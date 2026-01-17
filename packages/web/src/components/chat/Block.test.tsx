import { render, screen } from '@testing-library/react';
import Block from '@/components/chat/Block'; // <-- use path alias
import '@testing-library/jest-dom';

describe('Block component', () => {
  it('renders without crashing', () => {
    render(<Block />);
    // Check for a username input or a known label
    expect(screen.getByText(/username|lounge|language|guest|creator|viewer/i)).toBeInTheDocument();
  });
});

// To run this test file, use the following command:
// npx vitest run packages/web/src/components/chat/Block.test.tsx
