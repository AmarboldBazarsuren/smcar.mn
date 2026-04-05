import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800 mb-2">Алдаа гарлаа</p>
            <p className="text-lg text-gray-500 mb-4">Хуудсыг дахин ачааллана уу</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-lg font-semibold"
            >
              Дахин ачааллах
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
