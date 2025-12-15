import Contact from "./compoments/Contact";
import Message from "./compoments/Message";


export default function Home() {
  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">

        {/* Contacts sidebar */}
        <aside className="col-3 border-end d-flex flex-column p-0">
          <div className="p-3 border-bottom fw-bold">
            Contacts
          </div>

          <ul className="list-group list-group-flush flex-grow-1 overflow-auto">
            <Contact contact_name='bob' > Hello</Contact>
            <Contact contact_name='Phil' > How are you</Contact>
            <Contact contact_name='Andy' > Is there any plans today</Contact>
          </ul>
        </aside>

        {/* Message area */}
        <main className="col-9 d-flex flex-column p-0">

          {/* Chat header */}
          <div className="p-3 border-bottom fw-bold">
            Alice
          </div>

          {/* Messages */}
          <ul className="flex-grow-1 p-3 overflow-auto bg-dark no-bottom-padding">
           <Message home_user="Phil" contact_name="Alice">How are you</Message>
           <Message home_user="Phile" contact_name="Phile">I am fine</Message>
           <Message home_user="Phil" contact_name="Alice">Thats good</Message>
          </ul>

          {/* Input box */}
          <div className="p-3 border-top">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Type a message…"
              />
              <button className="btn btn-primary">
                Send
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
