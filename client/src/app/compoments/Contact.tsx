import React, { ReactNode } from 'react'
interface Props{
    contact_name: string
    children: ReactNode
}
const Contact = ({contact_name,children}: Props) => {
    
  return (
    <li className="list-group-item flex">
        <div className='contact-header fs-5'>{contact_name}</div>
        <div className='last-Message-text fs-6'>Last message: {children}</div>
    </li>
  )
}

export default Contact