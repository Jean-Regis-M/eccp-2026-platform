const ITEMS = [
  { icon: '✅', title: 'Complete Your Profile', desc: 'Fill all fields seriously — mentors use this for recommendations.' },
  { icon: '📅', title: 'Attend Every Session', desc: 'Join on time. Your mentor marks attendance after each session.' },
  { icon: '💭', title: 'Submit Daily Reflection', desc: 'Rate understanding, share feelings, and ask questions — all required.' },
  { icon: '📝', title: 'Take Session Quizzes', desc: 'Complete timed quizzes before they close. Missed quizzes affect your score.' },
  { icon: '🎯', title: 'Update Application Status', desc: 'Track universities you are applying to and any admissions received.' },
  { icon: '🤖', title: 'Use AI Ethically', desc: 'AI may assist brainstorming; essays must reflect your authentic voice.' },
  { icon: '💬', title: 'Stay in Touch', desc: 'Message your mentor when you need help. Do not wait until it is too late.' },
  { icon: '📚', title: 'Use Resource Library', desc: 'Review SAT prep, essay guides, and materials shared by your mentor.' },
];

export default function MenteeResponsibilities() {
  return (
    <div className="card-glow">
      <h3 className="font-display font-bold text-lg mb-4">📋 Your ECCP Responsibilities</h3>
      <div className="grid md:grid-cols-2 gap-3">
        {ITEMS.map((item, i) => (
          <div key={i} className="flex gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
