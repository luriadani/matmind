import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAppContext } from './Localization';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Only configure notifications if not in Expo Go
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

class NotificationScheduler {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (isExpoGo) {
      console.log('Notifications disabled in Expo Go');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      this.isInitialized = true;
      console.log('Notification scheduler initialized');
    } catch (error) {
      console.error('Error initializing notification scheduler:', error);
    }
  }

  async scheduleTrainingReminders(techniques, trainings) {
    if (isExpoGo || !this.isInitialized) {
      console.log('Skipping notification scheduling in Expo Go');
      return;
    }

    try {
      console.log('=== NOTIFICATION SCHEDULING DEBUG ===');
      console.log('Total techniques:', techniques.length);
      console.log('Total trainings:', trainings.length);
      
      // Cancel existing notifications
      await this.cancelAllNotifications();

      const { settings } = useAppContext();
      console.log('Notification settings:', settings);
      
      if (!settings?.notifications_enabled) {
        console.log('Notifications disabled in settings');
        return;
      }

      const minutesBefore = parseInt(settings.notification_minutes_before) || 10; // Default to 10 minutes
      console.log('Minutes before training:', minutesBefore);

      // Get upcoming trainings for the next 7 days
      const now = new Date();
      const upcomingTrainings = this.getUpcomingTrainings(trainings, 7);

      console.log(`Found ${upcomingTrainings.length} upcoming trainings in next 7 days`);

      for (const training of upcomingTrainings) {
        // Find techniques assigned to this specific training
        const trainingTechniques = techniques.filter(technique => 
          technique.training_id === training.id
        );

        // Also find techniques with "Try Next Class" category that have no specific training assignment
        const tryNextClassTechniques = techniques.filter(technique => {
          if (technique.training_id) return false; // Skip if already assigned to a specific training
          
          const categories = technique.category ? technique.category.split(',').map(cat => cat.trim()) : [];
          return categories.includes('Try Next Class');
        });

        // Combine techniques for this training
        const allTechniquesForTraining = [...trainingTechniques, ...tryNextClassTechniques];

        console.log(`Training ${training.dayOfWeek} at ${training.time} (${training.date.toDateString()}):`);
        console.log(`  - Specifically assigned techniques: ${trainingTechniques.length}`);
        console.log(`  - Try Next Class techniques: ${tryNextClassTechniques.length}`);
        console.log(`  - Total techniques for notification: ${allTechniquesForTraining.length}`);

        if (allTechniquesForTraining.length > 0) {
          console.log(`Scheduling notification for training ${training.dayOfWeek} at ${training.time} with ${allTechniquesForTraining.length} techniques`);
          await this.scheduleNotificationForTraining(training, allTechniquesForTraining, minutesBefore);
        }
      }
      
      // Schedule daily technique reminders for techniques with "Show Coach" category
      await this.scheduleDailyTechniqueReminders(techniques);
      
      console.log('=== NOTIFICATION SCHEDULING COMPLETE ===');
    } catch (error) {
      console.error('Error scheduling training reminders:', error);
    }
  }

  async scheduleNotificationForTraining(training, techniques, minutesBefore) {
    if (isExpoGo) return;

    try {
      // Use the training date if available, otherwise calculate next occurrence
      const trainingDateTime = training.date || this.getNextTrainingDate(training.dayOfWeek, training.time);
      
      // Calculate notification time
      const notificationTime = new Date(trainingDateTime.getTime() - (minutesBefore * 60 * 1000));

      console.log(`Notification scheduling for ${training.dayOfWeek} at ${training.time}:`);
      console.log(`  - Training time: ${trainingDateTime.toISOString()}`);
      console.log(`  - Notification time: ${notificationTime.toISOString()}`);
      console.log(`  - Current time: ${new Date().toISOString()}`);
      console.log(`  - Minutes before: ${minutesBefore}`);

      // Only schedule if notification time is in the future
      if (notificationTime > new Date()) {
        console.log(`  - Scheduling notification (time is in future)`);
        
        const techniquesList = techniques.slice(0, 3).map(t => t.title).join(', ');
        const moreCount = techniques.length > 3 ? ` and ${techniques.length - 3} more` : '';
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🥋 Training Reminder',
            body: `Time for ${training.category} training! Review: ${techniquesList}${moreCount}`,
            data: { 
              trainingId: training.id,
              techniqueIds: techniques.map(t => t.id),
              type: 'training_reminder'
            },
          },
          trigger: {
            date: notificationTime,
          },
        });
        
        console.log(`  - Notification scheduled successfully`);
      } else {
        console.log(`  - Skipping notification (time is in past)`);
      }
    } catch (error) {
      console.error('Error scheduling notification for training:', error);
    }
  }

  getDayNumber(dayName) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.indexOf(dayName);
  }

  async cancelAllNotifications() {
    if (isExpoGo) return;
    
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  async getScheduledNotifications() {
    if (isExpoGo) return [];
    
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  parseTimeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  getUpcomingTrainings(trainings, daysAhead = 7) {
    const now = new Date();
    const upcomingTrainings = [];

    for (let i = 0; i < daysAhead; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(now.getDate() + i);
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][checkDate.getDay()];

      const dayTrainings = trainings.filter(training => training.dayOfWeek === dayName);
      
      for (const training of dayTrainings) {
        const trainingDateTime = new Date(checkDate);
        const [hours, minutes] = training.time.split(':').map(Number);
        trainingDateTime.setHours(hours, minutes, 0, 0);

        // Only include if training is in the future
        if (trainingDateTime > now) {
          upcomingTrainings.push({
            ...training,
            date: trainingDateTime
          });
        }
      }
    }

    return upcomingTrainings.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  getNextTrainingDate(dayOfWeek, time) {
    const now = new Date();
    const targetDay = this.getDayNumber(dayOfWeek);
    const [hours, minutes] = time.split(':').map(Number);
    
    const nextDate = new Date(now);
    const currentDay = now.getDay();
    
    let daysUntilTraining = targetDay - currentDay;
    if (daysUntilTraining < 0) {
      daysUntilTraining += 7; // Next week
    } else if (daysUntilTraining === 0) {
      // Same day - check if time has passed
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const trainingTime = hours * 60 + minutes;
      if (trainingTime <= currentTime) {
        daysUntilTraining = 7; // Next week
      }
    }
    
    nextDate.setDate(now.getDate() + daysUntilTraining);
    nextDate.setHours(hours, minutes, 0, 0);
    
    return nextDate;
  }

  async scheduleDailyTechniqueReminders(techniques) {
    if (isExpoGo) return;

    try {
      // Find techniques with "Show Coach" category
      const showCoachTechniques = techniques.filter(technique => {
        const categories = technique.category ? technique.category.split(',').map(cat => cat.trim()) : [];
        return categories.includes('Show Coach');
      });

      if (showCoachTechniques.length === 0) return;

      // Schedule daily reminders at 9 AM for the next 7 days
      for (let i = 1; i <= 7; i++) {
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + i);
        reminderDate.setHours(9, 0, 0, 0);

        // Only schedule if the time is in the future
        if (reminderDate > new Date()) {
          const randomTechnique = showCoachTechniques[Math.floor(Math.random() * showCoachTechniques.length)];
          
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '💡 Technique Reminder',
              body: `Don't forget to show your coach: ${randomTechnique.title}`,
              data: { 
                techniqueId: randomTechnique.id,
                type: 'technique_reminder'
              },
            },
            trigger: {
              date: reminderDate,
            },
          });
        }
      }

      console.log(`Scheduled daily reminders for ${showCoachTechniques.length} "Show Coach" techniques`);
    } catch (error) {
      console.error('Error scheduling daily technique reminders:', error);
    }
  }
}

const notificationScheduler = new NotificationScheduler();

export const useNotificationScheduler = () => {
  const { settings } = useAppContext();

  const scheduleReminders = async (techniques, trainings) => {
    if (isExpoGo) {
      console.log('Notifications disabled in Expo Go');
      return;
    }

    if (!settings?.notifications_enabled) {
      return;
    }

    await notificationScheduler.initialize();
    await notificationScheduler.scheduleTrainingReminders(techniques, trainings);
  };

  return {
    scheduleReminders,
    cancelAllNotifications: () => notificationScheduler.cancelAllNotifications(),
    getScheduledNotifications: () => notificationScheduler.getScheduledNotifications(),
  };
};

export default notificationScheduler; 