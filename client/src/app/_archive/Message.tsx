import React, { ReactNode } from 'react'
interface Props{
    contact_name: string
    children: ReactNode
    home_user: string
}
const Message = ({contact_name,children,home_user}: Props) => {
    
  let additonal_classes = "";
  if(contact_name === home_user){
    additonal_classes = "text-end";
  }

  return (
    <li className={"list-group-item flex "+additonal_classes}>
        <div className='contact-header fs-5'>{contact_name}</div>
        <div className='last-Message-text fs-6'>{children}</div>
    </li>
  )
}

export default Message