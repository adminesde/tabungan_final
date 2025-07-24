import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  // errorInfo dihapus dari state karena tidak perlu memicu re-render
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null }; // State disederhanakan
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Memperbarui state agar render berikutnya menampilkan UI fallback.
    return { hasError: true, error }; // Hanya mengembalikan hasError dan error
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Anda juga dapat mencatat error ke layanan pelaporan error
    console.error("Uncaught error:", error, errorInfo);
    // this.setState({ errorInfo }); dihapus untuk mencegah potensi loop re-render
  }

  render() {
    if (this.state.hasError) {
      // Anda dapat merender UI fallback kustom apa pun
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-800 p-4">
          <h1 className="text-2xl font-bold mb-4">Terjadi Kesalahan!</h1>
          <p className="text-lg mb-2">Maaf, terjadi masalah saat memuat aplikasi.</p>
          <p className="text-sm text-red-600 mb-4">Silakan coba muat ulang halaman atau hubungi dukungan.</p>
          {this.state.error && (
            <details className="mt-4 p-4 bg-red-100 rounded-lg text-sm text-red-700 max-w-lg overflow-auto">
              <summary className="font-semibold cursor-pointer">Detail Error</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words">
                {this.state.error.toString()}
                {/* this.state.errorInfo?.componentStack dihapus karena errorInfo tidak lagi di state */}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;