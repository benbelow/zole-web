package zole;

import java.awt.Graphics;
import java.awt.LayoutManager;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.KeyListener;

import javax.swing.*;

@SuppressWarnings("serial")
public class ZolePanel extends JPanel { // The extension of JPanel where things
										// are drawn etc.

	public boolean finishedsetup = false;

	public ZolePanel(LayoutManager layout) {
		super(layout);
		Timer timer = new Timer(0, new ActionListener() {
			public void actionPerformed(ActionEvent arg0) {
				ZolePanel.this.repaint();
			}
		});
		timer.start();
		KeyListener listener = new ZoleKeyListener();
		addKeyListener(listener);
		setFocusable(true);
	}

	public void paintComponent(Graphics g) {
		if (!finishedsetup) {
			return;
		}
		super.paintComponent(g);
		for (CardPainter cardpainter : AppFrame.cardpainterlist) {
			if (cardpainter.card.visible) {
				cardpainter.paint(g);
			}

		}
		for (Player player : AppFrame.playerlist){
			g.drawString(Integer.toString(player.roundposition) + player.name,10,(3*AppFrame.height)/4 - ((71/2) + player.tableposition*100));
		    g.drawString(player.status,900,(3*AppFrame.height)/4 - ((71/2) + player.tableposition*100));
		}
	}
}