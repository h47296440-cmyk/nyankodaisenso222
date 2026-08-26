import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackView?: () => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error in ' + (this.props.componentName || 'Component') + ':', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.fallbackView) {
      this.props.fallbackView();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] bg-stone-950 flex flex-col items-center justify-center p-4 text-white font-['M_PLUS_Rounded_1c']">
          <div className="max-w-md w-full bg-stone-900 border-2 border-amber-500 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400">
              <AlertTriangle size={32} />
            </div>

            <div>
              <h2 className="text-xl font-black text-amber-400">
                にゃんこが一時的につまづいたにゃ！
              </h2>
              <p className="text-xs text-stone-300 mt-1">
                画面の表示中に予期せぬエラーが発生しました。以下のボタンから復旧できます。
              </p>
            </div>

            {this.state.error && (
              <div className="w-full bg-stone-950 p-3 rounded-xl border border-stone-800 text-left font-mono text-[10px] text-rose-300 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="w-full flex gap-2 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-transform cursor-pointer"
              >
                <Home size={15} />
                <span>マップ/基地へ戻る</span>
              </button>

              <button
                onClick={this.handleReload}
                className="py-2.5 px-4 bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 border border-stone-600 shadow transition-transform cursor-pointer"
              >
                <RefreshCw size={15} />
                <span>再読込</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
