import { redirect } from "next/navigation";

export default function ContactsPage() {
  redirect("/home");
}

type Contact = {
  id: number;
  displayName: string;
  status: boolean;
  addedAt: string;
};

type PublicUser = {
  id: number;
  displayName: string;
  isAlreadyContact: boolean;
};

type ApiResponse = {
  success: boolean;
  count?: number;
  data?: Contact[] | PublicUser[];
  error?: string;
  message?: string;
};

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showPublicModal, setShowPublicModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [publicUsers, setPublicUsers] = useState<PublicUser[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(false);
  const [requestDisplayName, setRequestDisplayName] = useState("");
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    try {
      const storedUsername = localStorage.getItem("cubcha_username") || "";
      setUsername(storedUsername);
      if (!storedUsername) {
        router.replace("/");
      }
    } catch {
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    if (!username) {
      router.replace("/");
      return;
    }
    fetchContacts();
  }, [username, router]);

  const fetchContacts = async () => {
    try {
      const url = buildApiUrl(`/contacts?username=${encodeURIComponent(username)}`);
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.success) {
        setError(data.error || "Unable to load contacts");
        return;
      }
      setContacts((data.data as Contact[]) || []);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const fetchPublicUsers = async () => {
    if (!username) {
      alert("Session expired. Please log in again.");
      router.replace("/");
      return;
    }
    setLoading(true);
    try {
      const url = buildApiUrl(`/contacts/public-users?username=${encodeURIComponent(username)}`);
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.success) {
        alert(data.error || "Unable to load public users");
        return;
      }
      setPublicUsers((data.data as PublicUser[]) || []);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPublicUser = async (userId: number) => {
    // Optimistic update — mark as added immediately
    setPublicUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isAlreadyContact: true } : u))
    );

    try {
      const { ok, data } = await postJson("/contacts/add-public", {
        username,
        contactUserId: userId,
      });
      if (!ok || !data.success) {
        // Roll back optimistic update on failure
        setPublicUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isAlreadyContact: false } : u))
        );
        return;
      }
      fetchContacts();
    } catch {
      // Roll back on error
      setPublicUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isAlreadyContact: false } : u))
      );
    }
  };

  const handleSendRequest = async () => {
    if (!requestDisplayName.trim()) {
      alert("Please enter a display name");
      return;
    }

    setLoading(true);
    try {
      const { ok, data } = await postJson("/contacts/request", {
        username,
        displayName: requestDisplayName.trim(),
      });
      if (!ok || !data.success) {
        alert(data.error || "Failed to send request");
        return;
      }
      alert(data.message || "Request sent successfully!");
      setShowRequestModal(false);
      setRequestDisplayName("");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const sortedPublicUsers = useMemo(() => {
    const sorted = [...publicUsers];
    sorted.sort((a, b) => {
      if (sortOrder === "asc") {
        return a.displayName.localeCompare(b.displayName);
      }
      return b.displayName.localeCompare(a.displayName);
    });
    return sorted;
  }, [publicUsers, sortOrder]);

  const openPublicModal = () => {
    if (!username) {
      alert("Session expired. Please log in again.");
      router.replace("/");
      return;
    }
    setShowPublicModal(true);
    fetchPublicUsers();
  };

  return (
    <div className="mobile-chats-screen">
      <section className="chats-list-card">
        <div className="chats-card-titlebar">
          <span className="chats-card-title">Contacts</span>
          <div className="add-contact-buttons">
            <button
              className="add-contact-btn"
              onClick={openPublicModal}
            >
              <span className="add-icon">+</span> Public
            </button>
            <button
              className="add-contact-btn"
              onClick={() => setShowRequestModal(true)}
            >
              <span className="add-icon">+</span> Request
            </button>
          </div>
        </div>

        {error ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true" />
            <h2>Could not load contacts</h2>
            <p>{error}</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true" />
            <h2>No contacts yet</h2>
            <p>Add contacts using the buttons above.</p>
          </div>
        ) : (
          <ul className="list-group list-group-flush chats-list">
            {contacts.map((c) => (
              <li key={c.id} className="list-group-item contact-item">
                <div className="contact-header">{c.displayName}</div>
                <div className="contact-meta">
                  Added: {new Date(c.addedAt).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Public Users Modal */}
      {showPublicModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowPublicModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Public User</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPublicModal(false)}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <span className="text-muted">Sort by name:</span>
                  <div className="btn-group btn-group-sm" role="group">
                    <button
                      type="button"
                      className={`sort-btn ${sortOrder === "asc" ? "active" : ""}`}
                      onClick={() => setSortOrder("asc")}
                    >
                      A-Z
                    </button>
                    <button
                      type="button"
                      className={`sort-btn ${sortOrder === "desc" ? "active" : ""}`}
                      onClick={() => setSortOrder("desc")}
                    >
                      Z-A
                    </button>
                  </div>
                </div>

                {loading ? (
                  <p className="text-center">Loading users...</p>
                ) : sortedPublicUsers.length === 0 ? (
                  <p className="text-center text-muted">No public users available</p>
                ) : (
                  <ul className="user-list">
                    {sortedPublicUsers.map((user) => (
                      <li
                        key={user.id}
                        className="user-list-item"
                      >
                        <span 
                          className="user-name"
                          style={{
                            color: user.isAlreadyContact ? '#00FFFF' : 'inherit'
                          }}
                        >
                          {user.displayName}{user.isAlreadyContact ? " ✓" : ""}
                        </span>
                        <button
                          className="user-add-btn"
                          onClick={() => handleAddPublicUser(user.id)}
                          disabled={loading || user.isAlreadyContact}
                        >
                          {user.isAlreadyContact ? "Added" : "Add"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPublicModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowRequestModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Send Contact Request</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRequestModal(false)}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">
                  Enter the display name of the user you want to add.
                </p>
                <div className="mb-3">
                  <label htmlFor="displayNameInput" className="form-label">
                    Display Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="displayNameInput"
                    placeholder="Enter display name"
                    value={requestDisplayName}
                    onChange={(e) => setRequestDisplayName(e.target.value)}
                  />
                </div>
                <div className="alert alert-info" role="alert">
                  <small>
                    <strong>Note:</strong> This feature is not yet fully implemented on the
                    backend. The request will be sent but no action will be taken.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRequestModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSendRequest}
                  disabled={loading || !requestDisplayName.trim()}
                >
                  {loading ? "Sending..." : "Send Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
