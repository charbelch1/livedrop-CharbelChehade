import React from 'react'

export const AppLayout: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="max-w-6xl mx-auto w-full px-4">{children}</div>
)

