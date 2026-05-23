import React from "react";
import { clearUserProfileStorage } from "./userProfile";

interface AppErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    error: null
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Sift UI error", error, info);
  }

  private reload = () => {
    window.location.reload();
  };

  private resetProfileAndReload = () => {
    clearUserProfileStorage();
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="app-error-screen">
        <section className="app-error-panel">
          <div>
            <p className="app-error-kicker">Sift</p>
            <h1>界面加载失败</h1>
            <p>本地界面遇到异常。可以先重新打开；如果刚修改过昵称或头像，请重置本地个人资料后再进入。</p>
          </div>
          <div className="app-error-actions">
            <button className="btn-primary" onClick={this.reload} type="button">
              重新打开
            </button>
            <button className="btn-ghost" onClick={this.resetProfileAndReload} type="button">
              重置昵称和头像
            </button>
          </div>
        </section>
      </main>
    );
  }
}
