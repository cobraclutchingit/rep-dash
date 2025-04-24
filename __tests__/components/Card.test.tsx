import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';

import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

describe('Card Components', () => {
  describe('Card', () => {
    test('renders the Card with children', () => {
      render(<Card data-testid="card">Card content</Card>);

      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent('Card content');
      expect(card).toHaveClass('rounded-lg');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('bg-card');
      expect(card).toHaveClass('text-card-foreground');
    });

    test('applies custom className', () => {
      render(
        <Card className="custom-class" data-testid="card">
          Card content
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('rounded-lg');
    });
  });

  describe('CardHeader', () => {
    test('renders the CardHeader with children', () => {
      render(<CardHeader data-testid="card-header">Header content</CardHeader>);

      const header = screen.getByTestId('card-header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveTextContent('Header content');
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('flex-col');
      expect(header).toHaveClass('space-y-1.5');
      expect(header).toHaveClass('p-6');
    });
  });

  describe('CardTitle', () => {
    test('renders the CardTitle with children', () => {
      render(<CardTitle data-testid="card-title">Card Title</CardTitle>);

      const title = screen.getByTestId('card-title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Card Title');
      expect(title.tagName).toBe('H3');
      expect(title).toHaveClass('text-lg');
      expect(title).toHaveClass('font-semibold');
    });
  });

  describe('CardDescription', () => {
    test('renders the CardDescription with children', () => {
      render(<CardDescription data-testid="card-desc">Card Description</CardDescription>);

      const desc = screen.getByTestId('card-desc');
      expect(desc).toBeInTheDocument();
      expect(desc).toHaveTextContent('Card Description');
      expect(desc.tagName).toBe('P');
      expect(desc).toHaveClass('text-sm');
      expect(desc).toHaveClass('text-muted-foreground');
    });
  });

  describe('CardContent', () => {
    test('renders the CardContent with children', () => {
      render(<CardContent data-testid="card-content">Content text</CardContent>);

      const content = screen.getByTestId('card-content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent('Content text');
      expect(content).toHaveClass('p-6');
      expect(content).toHaveClass('pt-0');
    });
  });

  describe('CardFooter', () => {
    test('renders the CardFooter with children', () => {
      render(<CardFooter data-testid="card-footer">Footer content</CardFooter>);

      const footer = screen.getByTestId('card-footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveTextContent('Footer content');
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('items-center');
      expect(footer).toHaveClass('p-6');
      expect(footer).toHaveClass('pt-0');
    });
  });

  describe('Card composition', () => {
    test('renders a complete card with all components', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Complete Card</CardTitle>
            <CardDescription>This is a complete card example</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the main content area</p>
          </CardContent>
          <CardFooter>
            <p>Footer content</p>
          </CardFooter>
        </Card>
      );

      const card = screen.getByTestId('complete-card');
      expect(card).toBeInTheDocument();

      expect(screen.getByText('Complete Card')).toBeInTheDocument();
      expect(screen.getByText('This is a complete card example')).toBeInTheDocument();
      expect(screen.getByText('This is the main content area')).toBeInTheDocument();
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });
  });
});
