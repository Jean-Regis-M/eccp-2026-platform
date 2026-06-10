import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ECCP render error:', error, info);
  }

  handleRetry = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full card text-center space-y-4">
            <div className="text-5xl">⚠️</div>
            <h1 className="font-display text-xl font-bold text-equity-dark">Something went wrong</h1>
            <p className="text-sm text-gray-500">
              The page could not load. This is usually temporary — try refreshing or return to the home page.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button onClick={this.handleRetry} className="btn-primary">Refresh Page</button>
              <button onClick={this.handleGoHome} className="btn-outline">Go Home</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
