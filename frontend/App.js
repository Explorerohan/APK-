import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Switch, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal, Pressable } from 'react-native';
import axios from 'axios';

const API_URL = 'http://192.168.254.3:8000/api/todoinfo/'; 

export default function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTodo, setEditTodo] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCompleted, setEditCompleted] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setTodos(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch todos');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleAddTodo = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Validation', 'Title and Description are required.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await axios.post(API_URL, {
        title,
        description,
        completed,
      });
      setTodos([response.data, ...todos]);
      setTitle('');
      setDescription('');
      setCompleted(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add todo');
    }
    setSubmitting(false);
  };

  const handleDeleteTodo = async (id) => {
    try {
      await axios.delete(`${API_URL}${id}/`);
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      Alert.alert('Error', 'Failed to delete todo');
    }
  };

  const openEditModal = (todo) => {
    setEditTodo(todo);
    setEditTitle(todo.title);
    setEditDescription(todo.description);
    setEditCompleted(todo.completed);
    setEditModalVisible(true);
  };

  const handleEditTodo = async () => {
    if (!editTitle.trim() || !editDescription.trim()) {
      Alert.alert('Validation', 'Title and Description are required.');
      return;
    }
    setEditSubmitting(true);
    try {
      const response = await axios.put(`${API_URL}${editTodo.id}/`, {
        title: editTitle,
        description: editDescription,
        completed: editCompleted,
      });
      setTodos(todos.map(todo => todo.id === editTodo.id ? response.data : todo));
      setEditModalVisible(false);
      setEditTodo(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update todo');
    }
    setEditSubmitting(false);
  };

  const renderItem = ({ item }) => (
    <View style={styles.todoItem}>
      <View style={styles.todoContent}>
        <View style={styles.todoHeader}>
          <Text style={styles.todoTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.statusBadge, item.completed ? styles.completedBadge : styles.pendingBadge]}>
            <Text style={styles.statusText}>
              {item.completed ? 'Completed' : 'Pending'}
            </Text>
          </View>
        </View>
        <Text style={styles.todoDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
            <Text style={styles.actionText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteTodo(item.id)}>
            <Text style={styles.actionText}>🗑️ Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.header}>TODO List</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            editable={!submitting}
          />
          <TextInput
            style={[styles.input, { height: 60 }]}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            editable={!submitting}
          />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Completed:</Text>
            <Switch
              value={completed}
              onValueChange={setCompleted}
              disabled={submitting}
            />
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddTodo}
            disabled={submitting}
          >
            <Text style={styles.addButtonText}>{submitting ? 'Adding...' : 'Add Todo'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.listContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <FlatList
              data={todos}
              keyExtractor={item => item.id?.toString() || Math.random().toString()}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 40 }}
              ListEmptyComponent={<Text style={styles.emptyText}>No todos yet.</Text>}
            />
          )}
        </View>
        <Modal
          visible={editModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>Edit Todo</Text>
              <TextInput
                style={styles.input}
                placeholder="Title"
                value={editTitle}
                onChangeText={setEditTitle}
                editable={!editSubmitting}
              />
              <TextInput
                style={[styles.input, { height: 60 }]}
                placeholder="Description"
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
                editable={!editSubmitting}
              />
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Completed:</Text>
                <Switch
                  value={editCompleted}
                  onValueChange={setEditCompleted}
                  disabled={editSubmitting}
                />
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleEditTodo}
                  disabled={editSubmitting}
                >
                  <Text style={styles.addButtonText}>{editSubmitting ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: '#aaa', marginLeft: 10 }]}
                  onPress={() => setEditModalVisible(false)}
                  disabled={editSubmitting}
                >
                  <Text style={styles.addButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <StatusBar style="dark" />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 20,
    alignSelf: 'center',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  input: {
    backgroundColor: '#f1f3f6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e3e6ea',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    marginTop: 10,
  },
  todoItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  todoContent: {
    flex: 1,
  },
  todoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  todoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  completedBadge: {
    backgroundColor: '#34C759',
  },
  pendingBadge: {
    backgroundColor: '#FF9500',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  todoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  deleteBtn: {
    backgroundColor: '#FF3B30',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  modalHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
    alignSelf: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 16,
    marginTop: 40,
  },
});
