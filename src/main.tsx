import React from 'react'
import ReactDOM from 'react-dom/client'
import IntegrationRoot from './auth/IntegrationRoot'
import 'tdesign-react/es/style/index.css'
import './index.css'
import './design-system/tokens.css'
import './design-system/components.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <IntegrationRoot />
  </React.StrictMode>,
)
