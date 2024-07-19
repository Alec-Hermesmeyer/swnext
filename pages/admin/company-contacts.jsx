import React, { useState, useEffect } from "react";
import styles from "@/styles/Admin.module.css";
import withAuth from "@/components/withAuth";
import { truncateText } from "@/utils/truncateText";
import { GridPattern } from "@/components/GridPattern";
import { createClient } from "@supabase/supabase-js";
import { Inter } from "next/font/google";
import { Lato } from "next/font/google";
import AdminLayout from "@/components/AdminLayout";
import Link from "next/link";
import supabase from "@/components/Supabase";

const lato = Lato({ weight: ["900"], subsets: ["latin"] });

function Spacer() {
  return (
    <GridPattern className={styles.gridPattern} yOffset={10} interactive />
  );
}
function OfficeContacts() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const fetchContacts = async () => {
        try {
          let { data, error } = await supabase
            .from('company_contacts')
            .select('*');
  
          if (error) {
            console.error('Error fetching contacts:', error);
          } else {
            setContacts(data);
          }
        } catch (error) {
          console.error('Unexpected error fetching contacts:', error);
        } finally {
          setLoading(false);
        }
      };
  
      fetchContacts();
    }, []);
  
    if (loading) {
      return <div>Loading...</div>;
    }
  
    return (
      <div className={styles.officeContactsContainer}>
        <div className={styles.gridOC}>
          {contacts.map((contact, index) => (
            <div className={styles.officeContactCard} key={index}>
              <h2 className={lato.className}>{contact.name}</h2>
              <p className={lato.className}>{contact.job_title}<br />
                <br /><Link className={styles.email} href={`mailto:${contact.email}`}>{contact.email}</Link> <br />
                <br /><Link className={styles.contactNumber} href={`tel:${contact.phone}`}>{contact.phone}</Link></p>
            </div>
          ))}
        </div>
      </div>
    );
  }
    function ManageContacts() {
        const [contacts, setContacts] = useState([]);
        const [newContact, setNewContact] = useState({ name: '', job_title: '', email: '', phone: '' });
        const [loading, setLoading] = useState(true);
      
        useEffect(() => {
          const fetchContacts = async () => {
            try {
              let { data, error } = await supabase
                .from('company_contacts')
                .select('*');
      
              if (error) {
                console.error('Error fetching contacts:', error);
              } else {
                setContacts(data);
              }
            } catch (error) {
              console.error('Unexpected error fetching contacts:', error);
            } finally {
              setLoading(false);
            }
          };
      
          fetchContacts();
        }, []);
      
        const handleAddContact = async (e) => {
            e.preventDefault();
            console.log('Adding contact:', newContact);
            try {
              let { data, error } = await supabase
                .from('company_contacts')
                .upsert([newContact]);
        
              if (error) {
                console.error('Error adding contact:', error);
              } else {
                console.log('Added contact:', data);
                setContacts([...contacts, ...data]);
                setNewContact({ name: '', job_title: '', email: '', phone: '' });
              }
            } catch (error) {
              console.error('Unexpected error adding contact:', error);
            }
          };
        
          const handleDeleteContact = async (id) => {
            console.log('Deleting contact with id:', id);
            try {
              let { error } = await supabase
                .from('company_contacts')
                .delete()
                .eq('id', id);
        
              if (error) {
                console.error('Error deleting contact:', error);
              } else {
                setContacts(contacts.filter((contact) => contact.id !== id));
              }
            } catch (error) {
              console.error('Unexpected error deleting contact:', error);
            }
          };
        
          return (
            <div className={styles.manageContacts}>
              <h2>Manage Company Contacts</h2>
              <form onSubmit={handleAddContact}>
                <div>
                  <label>
                    Name:
                    <input
                      type="text"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      required
                    />
                  </label>
                </div>
                <div>
                  <label>
                    Job Title:
                    <input
                      type="text"
                      value={newContact.job_title}
                      onChange={(e) => setNewContact({ ...newContact, job_title: e.target.value })}
                      required
                    />
                  </label>
                </div>
                <div>
                  <label>
                    Email:
                    <input
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      required
                    />
                  </label>
                </div>
                <div>
                  <label>
                    Phone:
                    <input
                      type="tel"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      required
                    />
                  </label>
                </div>
                <button type="submit">Add Contact</button>
              </form>
        
              <h3>Current Contacts</h3>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <ul>
                  {contacts.map((contact) => (
                    <li key={contact.id}>
                      {contact.name} | {contact.job_title} | {contact.email} | {contact.phone}{' '}
                      <button onClick={() => handleDeleteContact(contact.id)}>Delete</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        }
  
function AddNewContact() {
  //this function will allow admin to add a new user to the supabase database
  return (
    <div>
      <h1>Add User</h1>
    </div>
  );
}

function DeleteContact() {
  //this function will allow admin to delete a user from the supabase database
  return (
    <div>
      <h1>Delete User</h1>
    </div>
  );
}
const Admin = () => {
  return (
   
    <div className={styles.admin}>
      <Spacer className={styles.spacer} />
      <section className={styles.contactWidgetOffice}>
        <OfficeContacts />
      </section>
      <section className={styles.contactWidgetOffice}>
        <ManageContacts />
      </section>
      <Spacer className={styles.spacer} />
    </div>
    
  );
};

export default withAuth(Admin);
