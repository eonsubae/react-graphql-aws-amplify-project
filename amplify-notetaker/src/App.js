import React, { useState, useEffect } from 'react';
import { API, graphqlOperation } from 'aws-amplify';
import { withAuthenticator } from 'aws-amplify-react';

import { listNotes } from './graphql/queries';
import { createNote, deleteNote, updateNote } from './graphql/mutations';
import {
  onCreateNote,
  onDeleteNote,
  onUpdateNote,
} from './graphql/subscriptions';

const App = (_) => {
  const [id, setId] = useState();
  const [note, setNote] = useState();
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    getNotes();
    // (async function getNotes() {
    //   const result = await API.graphql(graphqlOperation(listNotes));
    //   const newNotes = await result.data.listNotes.items;
    //   setNotes(newNotes);
    // })();
  }, []);

  useEffect(() => {
    const createNoteListener = API.graphql(
      graphqlOperation(onCreateNote)
    ).subscribe({
      next: (noteData) => {
        const newNote = noteData.value.data.onCreateNote;
        // const prevNotes = notes.filter((note) => note.id !== newNote.id);
        const updatedNotes = [...notes, newNote];
        setNotes(updatedNotes);
      },
    });
    const updateNoteListener = API.graphql(
      graphqlOperation(onUpdateNote)
    ).subscribe({
      next: (noteData) => {
        const updatedNote = noteData.value.data.onUpdateNote;
        const index = notes.findIndex((note) => note.id === updatedNote.id);
        const updatedNotes = [
          ...notes.slice(0, index),
          updatedNote,
          ...notes.slice(index + 1),
        ];
        setId('');
        setNote('');
        setNotes(updatedNotes);
      },
    });
    const deleteNoteListener = API.graphql(
      graphqlOperation(onDeleteNote)
    ).subscribe({
      next: (noteData) => {
        const deletedNote = noteData.value.data.onDeleteNote;
        const updatedNotes = notes.filter((note) => note.id !== deletedNote.id);
        setNotes(updatedNotes);
      },
    });

    return () => {
      createNoteListener.unsubscribe();
      updateNoteListener.unsubscribe();
      deleteNoteListener.unsubscribe();
    };
  }, [notes]);

  const getNotes = async () => {
    const result = await API.graphql(graphqlOperation(listNotes));
    const newNotes = result.data.listNotes.items;
    setNotes(newNotes);
  };

  const handleChangeNote = (event) => setNote(event.target.value);

  const hasExistingNote = () => {
    if (id) {
      const isNote = notes.findIndex((note) => note.id === id) > -1;
      return isNote;
    }
    return false;
  };

  const handleUpdateNote = async () => {
    const input = { id, note };
    await API.graphql(graphqlOperation(updateNote, { input }));
    // const updatedNote = result.data.updateNote;
    // const index = notes.findIndex((note) => note.id === updatedNote.id);
    // const updatedNotes = [
    //   ...notes.slice(0, index),
    //   updatedNote,
    //   ...notes.slice(index + 1),
    // ];
    // setId('');
    // setNote('');
    // setNotes(updatedNotes);
  };

  const handleAddNote = async (event) => {
    event.preventDefault();

    // check if we have existing note, if so update it
    if (hasExistingNote()) {
      handleUpdateNote();
    } else {
      const input = { note };
      await API.graphql(graphqlOperation(createNote, { input }));
      // const newNote = result.data.createNote;
      // const updatedNotes = [newNote, ...notes];
      // setNotes(updatedNotes);
      setNote('');
    }
  };

  const handleSetNote = ({ note, id }) => {
    setId(id);
    setNote(note);
  };

  const handleDeleteNote = async (id) => {
    const input = { id };
    await API.graphql(graphqlOperation(deleteNote, { input }));
    // const deletedNoteId = result.data.deleteNote.id;
    // const updatedNotes = notes.filter((note) => note.id !== deletedNoteId);
    // setNotes(updatedNotes);
  };

  return (
    <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
      <h1 className="code f2-1">Amplify Notetaker</h1>
      {/* Note Form */}
      <form onSubmit={handleAddNote} className="mb3">
        <input
          type="text"
          className="pa2 f4"
          placeholder="Write your note"
          onChange={handleChangeNote}
          value={note}
        />
        <button className="pa2 f4" type="submit">
          {id ? 'Update Note' : 'Add Note'}
        </button>
      </form>

      {/* Notes List */}
      <div>
        {notes.map((item) => {
          return (
            <div key={item.id} className="flex items-center">
              <li onClick={(_) => handleSetNote(item)} className="list pa1 f3">
                {item.note}
              </li>
              <button
                onClick={(_) => handleDeleteNote(item.id)}
                className="bg-transparent bn f4"
              >
                <span>&times;</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default withAuthenticator(App, {
  includeGreetings: true,
});
