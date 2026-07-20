"use client"
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
        <div className='contact-header'>{contact_name}</div>
        <div className='last-Message-text'>Last message: {children}</div>
    </li>
  )
}

export default Contact