"use client"

import Contact from "./compoments/Contact";
import Message from "./compoments/Message";
import MessageBox from "./compoments/Message_box";
import { useState } from 'react'

export default function Home() {

  const [activeContact, setActiveContact] = useState<string | null>(null);



  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">

        {/* Contacts sidebar */}
        <aside className="col-3 border-end d-flex flex-column p-0">
          <div className="p-3 border-bottom fw-bold">
            Contacts
          </div>

          <ul className="list-group list-group-flush flex-grow-1 overflow-auto">
            <Contact contact_name='bob' onClick={() => setActiveContact("bob")}> Hello</Contact>
            <Contact contact_name='Phil' onClick={() => setActiveContact("Phil")}> How are you</Contact>
            <Contact contact_name='Andy' onClick={() => setActiveContact("Andy")}> Is there any plans today</Contact>
          </ul>
        </aside>
         <main className="col-9 d-flex flex-column p-0">
          {activeContact && (
            <MessageBox>
              <Message
                contact_name={activeContact}
                home_user="phile"
              >
                Hello
              </Message>
            </MessageBox>
          )}
        </main>
      </div>
    </div>
  );
}
