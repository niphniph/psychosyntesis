import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Psychosynthesis application error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#00241a] text-[#fbf9f3] flex flex-col justify-center items-center p-6 text-center">
          <div className="max-w-md w-full bg-[#0b251c] border border-[#c7a85b]/40 p-8 rounded-3xl space-y-4 shadow-2xl">
            <h1 className="text-3xl font-bold text-white font-serif">ფსიქოსინთეზის ინსტიტუტი</h1>
            <h2 className="text-lg font-bold text-[#c7a85b]">აპლიკაციის ჩატვირთვის შეცდომა</h2>
            <p className="text-xs text-[#a4d0be] leading-relaxed">
              აპლიკაციამ წააწყდა მოულოდნელ შეცდომას. გთხოვთ განაახლოთ გვერდი.
            </p>
            {this.state.error && (
              <pre className="text-[10px] text-red-300 bg-[#00241a] p-3 rounded-xl overflow-x-auto text-left font-mono border border-red-500/20 max-h-32">
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/psychosynthesis/';
              }}
              className="mt-4 bg-[#c7a85b] text-[#00241a] font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-[#ffdf95] transition-all cursor-pointer shadow-lg w-full"
            >
              მთავარ გვერდზე დაბრუნება
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
