import { Component } from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('Frontend render error:', error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="container-page grid min-h-[60vh] place-items-center py-16 text-center"><div><p className="eyebrow">Something went wrong</p><h1 className="section-title mt-3">We could not load this page.</h1><p className="mx-auto mt-4 max-w-lg text-zinc-600">Try refreshing the page. If the issue continues, return to the store and try again.</p><div className="mt-7 flex justify-center gap-3"><button className="btn-primary" onClick={() => window.location.reload()}>Refresh page</button><Link className="btn-secondary" to="/">Go home</Link></div></div></main>;
  }
}
