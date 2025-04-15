import { useState } from "react";
import { FileText, X } from "lucide-react";
const Note = ({ item = {} }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedNote, setSelectedNote] = useState("");
  
    const openModal = (note) => {
      setSelectedNote(note);
      setIsOpen(true);
    };
  
    const closeModal = () => {
      setIsOpen(false);
      setSelectedNote("");
    };
  
    return (
      <td className="border border-gray-300 p-2 text-center">
        {item?.notes ? ( // Use optional chaining to avoid errors
          <>
            <button
              onClick={() => openModal(item.notes)}
              className="p-1 text-gray-600 hover:text-gray-800 transition duration-200"
              title="View Notes"
            >
              <FileText size={16} />
            </button>
  
            {/* Modal Overlay */}
            {isOpen && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-5 relative">
                  {/* Close Button */}
                  <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                    onClick={closeModal}
                  >
                    <X size={20} />
                  </button>
  
                  {/* Modal Content */}
                  <h2 className="text-lg font-semibold text-gray-800">Notes</h2>
                  <p className="mt-2 text-gray-600">{selectedNote}</p>
  
                  {/* Close Button */}
                  <div className="mt-4 text-right">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          "—"
        )}
      </td>
    );
  };
  

export default Note;
