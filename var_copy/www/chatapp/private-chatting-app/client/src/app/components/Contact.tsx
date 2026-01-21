import React, { ReactNode } from 'react'
import type { ComponentType } from 'react'
interface Props{
    contact_name: string
    children: ReactNode
    onClick: () => void;
}
const Contact = ({contact_name,children,onClick}: Props) => {
    
  return (
    <li className="list-group-item flex" onClick={onClick}>
        <div className='contact-header fs-5' onClick={onClick}>{contact_name}</div>
        <div className='last-Message-text fs-6' onClick={onClick}>Last message: {children}</div>
    </li>
  )
}

export default Contact
