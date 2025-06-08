import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Modal, 
  SafeAreaView, 
  Image, 
  ActivityIndicator 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Colors from '../../constants/Colors';

const CreatePostModal = ({
  visible,
  onClose,
  newPostTitle,
  setNewPostTitle,
  newPostContent,
  setNewPostContent,
  selectedImage,
  setSelectedImage,
  isCreatingPost,
  onSubmit,
  onPickImage
}) => {
  // Use fallback colors and theme if context is not available
  let colors;
  try {
    const theme = useTheme();
    colors = theme.colors;
  } catch (error) {
    console.warn('ThemeContext not available in CreatePostModal, using default colors');
    colors = Colors;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.modalCancelButton, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Create Post</Text>
          <TouchableOpacity 
            onPress={onSubmit}
            disabled={isCreatingPost}
            style={{ opacity: isCreatingPost ? 0.6 : 1 }}
          >
            {isCreatingPost ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.modalPostButton, { color: colors.primary }]}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <TextInput
            style={[styles.titleInput, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="Title"
            placeholderTextColor={colors.textSecondary}
            value={newPostTitle}
            onChangeText={setNewPostTitle}
          />
          
          <TextInput
            style={[styles.contentInput, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="What's happening? (Minimum 10 characters)"
            placeholderTextColor={colors.textSecondary}
            value={newPostContent}
            onChangeText={setNewPostContent}
            multiline
            numberOfLines={6}
          />
          
          {/* Character Counter */}
          <View style={styles.characterCounterContainer}>
            <Text style={[
              styles.characterCounter, 
              { 
                color: newPostContent.length < 10 ? '#FF6B6B' : colors.textSecondary 
              }
            ]}>
              {newPostContent.length}/10 characters minimum
            </Text>
          </View>
          
          {selectedImage && (
            <View style={styles.selectedImageContainer}>
              <Image 
                source={{ uri: selectedImage.uri }} 
                style={styles.selectedImage}
                resizeMode="cover"
              />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
              {/* Image info */}
              <View style={styles.imageInfo}>
                <Text style={[styles.imageInfoText, { color: colors.textSecondary }]}>
                  {selectedImage.width}×{selectedImage.height}px
                  {selectedImage.fileSize && ` • ${(selectedImage.fileSize / (1024 * 1024)).toFixed(1)}MB`}
                </Text>
              </View>
            </View>
          )}
          
          <TouchableOpacity style={[styles.addImageButton, { borderColor: colors.primary }]} onPress={onPickImage}>
            <MaterialIcons name="add-photo-alternate" size={24} color={colors.primary} />
            <Text style={[styles.addImageText, { color: colors.primary }]}>Add Image</Text>
            <Text style={[styles.addImageSubtext, { color: colors.textSecondary }]}>
              JPG, PNG, GIF • Max 5MB
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = {
  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e4e6ea',
  },
  modalCancelButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalPostButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e4e6ea',
  },
  contentInput: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e4e6ea',
  },
  characterCounterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  characterCounter: {
    fontSize: 12,
    textAlign: 'right',
  },
  selectedImageContainer: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  selectedImage: {
    width: '100%',
    height: 250, // Increased height
    minHeight: 150,
    maxHeight: 350, // Maximum height for preview
    borderRadius: 12,
  },
  imageInfo: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  imageInfoText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '500',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addImageButton: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  addImageText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  addImageSubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
};

export default CreatePostModal; 