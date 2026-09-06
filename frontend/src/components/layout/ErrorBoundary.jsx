import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, EmptyState } from '../ui/index.js';

/** Stops one broken screen from blanking the whole app. */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    const { children } = this.props;
    if (!error) return children;

    return (
      <EmptyState
        icon={AlertTriangle}
        title="This screen hit a snag"
        description={error.message}
        action={<Button variant="primary" onClick={() => window.location.reload()}>Reload</Button>}
      />
    );
  }
}
