import { AccessProvider } from './access/AccessContext'
import { OperationsProvider } from './operations/OperationsContext'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { GroupProvider } from './groups/GroupContext'
import './index.css'
import { OrganizationProvider } from './organizations/OrganizationContext'
import { ClientProvider } from './clients/ClientContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AccessProvider><ClientProvider><OrganizationProvider><GroupProvider><OperationsProvider><App /></OperationsProvider></GroupProvider></OrganizationProvider></ClientProvider></AccessProvider>
  </React.StrictMode>,
)
